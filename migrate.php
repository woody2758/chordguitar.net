<?php

// --- 1. ปรับแก้ข้อมูลการเชื่อมต่อฐานข้อมูลของคุณ ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "woodysay_chord";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

// --- 2. ฟังก์ชันสำหรับแยกคอร์ดออกจากเนื้อเพลง ---
function separateChordAndLyric($line) {
    $chordRegex = '/(?:^|[\s(\/])([A-G][b#]?(?:m|M|sus|dim|aug|add|\+)?(?:[0-9])*(?:\/[A-G][b#]?(?:m|M|sus|dim|aug|add|\+)?(?:[0-9])*)?)(?:[\s)\/]|$)/ui';
    
    $chords = [];
    $hasChord = preg_match($chordRegex, $line);
    
    // --- แก้ไขโค้ดที่ทำให้เกิด Error ที่นี่ ---
    if (preg_match('/^intro:/i', $line) || preg_match('/^solo:/i', $line) || preg_match('/^guitar solo:/i', $line)) {
        return [
            'type' => 'chord',
            'content' => $line
        ];
    }
    // --- สิ้นสุดการแก้ไข ---
    
    if ($hasChord) {
        // Check if the line is purely chords (e.g., has many chords and no words)
        $analysis = preg_replace_callback($chordRegex, function($matches) {
            return '';
        }, $line);
        $trimmedAnalysis = trim(preg_replace('/\s+/', ' ', $analysis));

        if (empty($trimmedAnalysis) || preg_match('/^[,\/\-\s()]*$/', $trimmedAnalysis)) {
             return [
                'type' => 'chord',
                'content' => $line
            ];
        } else {
             return [
                'type' => 'chord_lyric',
                'content' => $line
            ];
        }
    } else {
        // If no chords found, it's a lyric line
        if (preg_match('/^ซ้ำ/u', $line) || preg_match('/^\(ซ้ำ/u', $line) || preg_match('/^chorus/i', $line) || preg_match('/^verse/i', $line) || preg_match('/^end/i', $line)) {
            return [
                'type' => 'meta',
                'content' => $line
            ];
        }
        return [
            'type' => 'lyric',
            'content' => $line
        ];
    }
}


// --- 3. การย้ายข้อมูลจากตาราง song ไปยัง song_content ---
$sql_select = "SELECT song_id, song_lyric, song_detail FROM song";
$result = $conn->query($sql_select);

if ($result->num_rows > 0) {
    // Prepare the INSERT statement for the new table
    $stmt_insert = $conn->prepare("INSERT INTO song_content (song_id, line_order, line_type, line_content) VALUES (?, ?, ?, ?)");
    $stmt_insert->bind_param("iiss", $songId, $lineOrder, $lineType, $lineContent);

    // Turn off autocommit for performance
    $conn->autocommit(FALSE);

    while ($row = $result->fetch_assoc()) {
        $songId = $row['song_id'];
        $fullContent = empty($row['song_detail']) ? $row['song_lyric'] : $row['song_detail'];
        
        $lines = explode("\n", $fullContent);
        
        $lineOrder = 0;
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            $analysis = separateChordAndLyric($line);
            $lineType = $analysis['type'];
            $lineContent = $analysis['content'];
            
            $lineOrder++;
            $stmt_insert->execute();
        }
    }
    
    // Commit the transaction
    $conn->commit();
    
    $stmt_insert->close();
    echo "Migration completed successfully. " . $result->num_rows . " songs processed.";
} else {
    echo "No songs found in the database.";
}

$conn->close();

?>