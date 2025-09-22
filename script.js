// --- 1. กำหนดค่า API Endpoint และฟังก์ชัน Transpose ---
const API_URL = 'api.php?request='; // ADJUST THIS URL
const CHORDS_LIST = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
const FLAT_PREFERRING_KEYS = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];

// Function to transpose a single chord
function transposeChord(chord, semitones, targetKey) {
    let mainChord = chord;
    let bassNotePart = '';
    const bassSplit = chord.split('/');
    if (bassSplit.length > 1) {
        mainChord = bassSplit[0];
        bassNotePart = '/' + bassSplit[1];
    }

    let root = '';
    let suffix = '';
    let found = false;

    const allPossibleRoots = [...CHORDS_LIST];
    for (const flat of Object.keys(FLAT_TO_SHARP_MAP)) {
        allPossibleRoots.push(flat);
    }
    allPossibleRoots.sort((a, b) => b.length - a.length);

    for (const n of allPossibleRoots) {
        if (mainChord.startsWith(n)) {
            const remaining = mainChord.substring(n.length);
            if (remaining === '' || /^[mMsusdimaugaadd\+0-9/]/.test(remaining[0])) {
                root = n;
                suffix = remaining;
                found = true;
                break;
            }
        }
    }

    if (!found) {
        return chord;
    }

    let effectiveRoot = FLAT_TO_SHARP_MAP[root] || root;
    let currentIndex = CHORDS_LIST.indexOf(effectiveRoot);

    if (currentIndex === -1) {
        return chord;
    }

    let newIndex = (currentIndex + semitones) % CHORDS_LIST.length;
    if (newIndex < 0) {
        newIndex += CHORDS_LIST.length;
    }

    let newRoot = CHORDS_LIST[newIndex];
    const commonSharps = Object.values(FLAT_TO_SHARP_MAP);

    if (FLAT_PREFERRING_KEYS.includes(targetKey) && commonSharps.includes(newRoot)) {
        for (const [flat, sharp] of Object.entries(FLAT_TO_SHARP_MAP)) {
            if (sharp === newRoot) {
                newRoot = flat;
                break;
            }
        }
    } else if (root in FLAT_TO_SHARP_MAP) {
        for (const [flat, sharp] of Object.entries(FLAT_TO_SHARP_MAP)) {
            if (sharp === newRoot) {
                newRoot = flat;
                break;
            }
        }
    }

    let transposedBassNote = '';
    if (bassNotePart) {
        const bassChord = bassNotePart.substring(1);
        transposedBassNote = '/' + transposeChord(bassChord, semitones, targetKey);
    }

    return newRoot + suffix + transposedBassNote;
}


// --- 2. การจัดการ UI และการสื่อสารกับ API ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const songId = urlParams.get('song_id') || 1; // Default to song ID 1 for demonstration
    fetchAndDisplaySong(songId);

    const originalKeySelect = document.getElementById('originalKeySelect');
    const targetKeySelect = document.getElementById('targetKeySelect');
    
    // Populate the key selects
    CHORDS_LIST.forEach(key => {
        const option1 = document.createElement('option');
        option1.value = key;
        option1.textContent = key;
        originalKeySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = key;
        option2.textContent = key;
        targetKeySelect.appendChild(option2);
    });
    
    // Add flat keys to selects
    Object.keys(FLAT_TO_SHARP_MAP).forEach(key => {
        const option1 = document.createElement('option');
        option1.value = key;
        option1.textContent = key;
        originalKeySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = key;
        option2.textContent = key;
        targetKeySelect.appendChild(option2);
    });

    const transposeButton = document.getElementById('transposeButton');
    if (transposeButton) {
        transposeButton.addEventListener('click', applyTranspose);
    }
    
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetKey);
    }

    // --- NEW: โค้ดสำหรับฟังก์ชันการค้นหา ---
    const searchInput = document.querySelector('.search-box input');
    const searchResultsDiv = document.createElement('div');
    searchResultsDiv.className = 'search-results';
    document.querySelector('.search-box').appendChild(searchResultsDiv);

    searchInput.addEventListener('input', debounce(handleSearch, 300));

    function handleSearch(event) {
        const query = event.target.value;
        if (query.length > 1) {
            fetchSearchResults(query);
        } else {
            searchResultsDiv.innerHTML = '';
            searchResultsDiv.style.display = 'none';
        }
    }

    async function fetchSearchResults(query) {
        try {
            const response = await fetch(`${API_URL}search&q=${encodeURIComponent(query)}`);
            const results = await response.json();
            displaySearchResults(results);
        } catch (error) {
            console.error('Error fetching search results:', error);
            searchResultsDiv.innerHTML = '<p>เกิดข้อผิดพลาดในการค้นหา</p>';
            searchResultsDiv.style.display = 'block';
        }
    }

    function displaySearchResults(results) {
        searchResultsDiv.innerHTML = '';
        if (results.length > 0) {
            const ul = document.createElement('ul');
            results.forEach(song => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="song/${song.song_id}">${song.song_name} <br><span>- ${song.artistis_name}</span></a>`;
                ul.appendChild(li);
            });
            searchResultsDiv.appendChild(ul);
            searchResultsDiv.style.display = 'block';
        } else {
            searchResultsDiv.innerHTML = '<p>ไม่พบเพลงที่ต้องการ</p>';
            searchResultsDiv.style.display = 'block';
        }
    }

    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    // --- สิ้นสุดโค้ดสำหรับฟังก์ชันการค้นหา ---
});

let originalSongContent = "";
let originalSongKey = "";

async function fetchAndDisplaySong(songId) {
    try {
        const response = await fetch(`${API_URL}songs/${songId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.error) {
            document.getElementById('song-lyrics').textContent = data.error;
            return;
        }

        document.getElementById('song-title').textContent = data.details.song_name;
        document.getElementById('artist-name').textContent = `เพลงโดย: ${data.details.artistis_name}`;
        
        const originalKeySpan = document.getElementById('original-key');
        if (data.details.song_key) {
             originalKeySpan.textContent = data.details.song_key;
             originalSongKey = data.details.song_key;
        } else {
             originalKeySpan.textContent = 'ไม่ระบุ';
        }

        document.getElementById('originalKeySelect').value = originalSongKey || 'C';
        document.getElementById('targetKeySelect').value = originalSongKey || 'C';

        const youtubeContainer = document.getElementById('youtube-container');
        if (data.details.song_youtube) {
             const videoId = data.details.song_youtube.split('v=')[1];
             if (videoId) {
                 youtubeContainer.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                 youtubeContainer.style.display = 'block';
             }
        } else {
             youtubeContainer.style.display = 'none';
        }

        let formattedContent = '';
        data.content.forEach(line => {
            if (line.line_type === 'chord' || line.line_type === 'chord_lyric') {
                formattedContent += `<pre class="chord-line">${line.line_content}</pre>`;
            } else {
                formattedContent += `<p class="lyric-line">${line.line_content}</p>`;
            }
        });
        
        document.getElementById('song-lyrics').innerHTML = formattedContent;
        originalSongContent = document.getElementById('song-lyrics').innerHTML;

    } catch (error) {
        console.error('Error fetching song:', error);
        document.getElementById('song-lyrics').textContent = 'ไม่สามารถโหลดเพลงได้ในขณะนี้';
    }
}

function applyTranspose() {
    const originalKey = document.getElementById('originalKeySelect').value;
    const targetKey = document.getElementById('targetKeySelect').value;
    
    if (originalKey === targetKey) {
        return;
    }

    const lyricsContainer = document.getElementById('song-lyrics');
    const lines = lyricsContainer.querySelectorAll('.chord-line');

    lines.forEach(line => {
        const lineContent = line.textContent;
        const chordRegex = /(?:^|[\s(\/])([A-G][b#]?(?:m|M|sus|dim|aug|add|\+)?(?:[0-9])*(?:\/[A-G][b#]?(?:m|M|sus|dim|aug|add|\+)?(?:[0-9])*)?)(?:[\s)\/]|$)/g;

        const transposedLine = lineContent.replace(chordRegex, (match, chordOnly) => {
            const transposedChord = transposeChord(chordOnly, CHORDS_LIST.indexOf(FLAT_TO_SHARP_MAP[targetKey] || targetKey) - CHORDS_LIST.indexOf(FLAT_TO_SHARP_MAP[originalKey] || originalKey), targetKey);
            return match.replace(chordOnly, transposedChord);
        });
        line.textContent = transposedLine;
    });
}

function resetKey() {
    document.getElementById('song-lyrics').innerHTML = originalSongContent;
    document.getElementById('originalKeySelect').value = originalSongKey || 'C';
    document.getElementById('targetKeySelect').value = originalSongKey || 'C';
}