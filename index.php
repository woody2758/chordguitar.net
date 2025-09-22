

<?php
include_once "main.config.php";
include_once "inc/main.function.php";
include_once "inc/inc.meta.php";
include_once "inc/inc.header.php";
?>
    <div class="ad-container ad-top-leaderboard">
        <p>[พื้นที่โฆษณาขนาดใหญ่]</p>
    </div>

    <main class="song-page-content">
        <div class="container">
            <article class="song-article">
                <h1 class="song-title" id="song-title"></h1>
                <h2 class="artist-name" id="artist-name"></h2>

                <div class="song-metadata">
                    <span class="key-info">คีย์เพลงต้นฉบับ: <span id="original-key"></span></span>
                </div>

                <div class="transpose-controls">
                    <label for="originalKeySelect">คีย์เดิม:</label>
                    <select id="originalKeySelect"></select>
                    <label for="targetKeySelect">เปลี่ยนไปคีย์:</label>
                    <select id="targetKeySelect"></select>
                    <button id="transposeButton">เปลี่ยนคีย์</button>
                    <button id="resetButton">รีเซ็ต</button>
                </div>

                <div class="chord-lyrics-area">
                    <pre id="song-lyrics" class="chord-text"></pre>
                </div>

                <div class="youtube-embed-container" id="youtube-container">
                    </div>

                <div class="ad-container ad-mid-content">
                    <p>[พื้นที่โฆษณาขนาดกลาง]</p>
                </div>

            </article>

            <aside class="sidebar">
                <div class="ad-container ad-sidebar-top">
                    <p>[พื้นที่โฆษณาด้านข้าง 1]</p>
                </div>

                <div class="related-songs">
                    <h3>เพลงที่เกี่ยวข้อง</h3>
                    <ul id="related-songs-list">
                        <li><a href="#">...</a></li>
                    </ul>
                </div>

                <div class="ad-container ad-sidebar-bottom">
                    <p>[พื้นที่โฆษณาด้านข้าง 2]</p>
                </div>
            </aside>
        </div>
    </main>

    <div class="ad-container ad-bottom-leaderboard">
        <p>[พื้นที่โฆษณาขนาดใหญ่ท้ายหน้า]</p>
    </div>

<?php
include_once "inc/inc.footer.php";
?>