<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// --- 1. ปรับแก้ข้อมูลการเชื่อมต่อฐานข้อมูลของคุณ ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "woodysay_chord";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed.']);
    exit();
}

$conn->set_charset("utf8mb4");

// --- 2. การจัดการ API Endpoints ---
$request = $_GET['request'] ?? '';
$parts = explode('/', $request);

switch ($parts[0]) {
    case 'songs':
        handleSongsRequest($conn, $parts);
        break;
    case 'search':
        handleSearchRequest($conn);
        break;
    default:
        echo json_encode(['error' => 'Invalid API request.']);
        break;
}

$conn->close();

// --- 3. ฟังก์ชันสำหรับจัดการ Request ---
function handleSongsRequest($conn, $parts) {
    if (isset($parts[1]) && is_numeric($parts[1])) {
        getSongById($conn, $parts[1]);
    } else {
        getAllSongs($conn);
    }
}

// Get all songs (title, artist, id)
function getAllSongs($conn) {
    $sql = "SELECT s.song_id, s.song_name, a.artistis_name 
            FROM song s
            JOIN artistis a ON s.artistis_id = a.artistis_id
            ORDER BY s.song_id DESC LIMIT 10"; // Get 10 latest songs
    
    $result = $conn->query($sql);
    $songs = [];
    while($row = $result->fetch_assoc()) {
        $songs[] = $row;
    }
    echo json_encode($songs);
}

// Get a single song by its ID
function getSongById($conn, $songId) {
    $stmt = $conn->prepare("SELECT s.song_id, s.song_name, a.artistis_name, s.song_youtube, s.song_key
                            FROM song s
                            JOIN artistis a ON s.artistis_id = a.artistis_id
                            WHERE s.song_id = ?");
    $stmt->bind_param("i", $songId);
    $stmt->execute();
    $result = $stmt->get_result();
    $songDetails = $result->fetch_assoc();
    $stmt->close();
    
    if (!$songDetails) {
        echo json_encode(['error' => 'Song not found.']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT line_order, line_type, line_content FROM song_content WHERE song_id = ? ORDER BY line_order ASC");
    $stmt->bind_param("i", $songId);
    $stmt->execute();
    $result = $stmt->get_result();
    $songContent = [];
    while($row = $result->fetch_assoc()) {
        $songContent[] = $row;
    }
    $stmt->close();

    $response = [
        'details' => $songDetails,
        'content' => $songContent
    ];
    echo json_encode($response);
}

// --- NEW: ฟังก์ชันการค้นหาเพลง ---
function handleSearchRequest($conn) {
    $query = $_GET['q'] ?? '';
    if (empty($query)) {
        echo json_encode([]); // Return empty array if query is empty
        return;
    }

    $searchTerm = "%" . $query . "%";
    $stmt = $conn->prepare("SELECT s.song_id, s.song_name, a.artistis_name 
                            FROM song s
                            JOIN artistis a ON s.artistis_id = a.artistis_id
                            WHERE s.song_name LIKE ? OR a.artistis_name LIKE ?
                            LIMIT 10");
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = [];
    while ($row = $result->fetch_assoc()) {
        $songs[] = $row;
    }
    $stmt->close();
    echo json_encode($songs);
}
?>