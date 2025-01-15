<?php
// Konfiguratsiooni muutujad
$host = 'localhost';  // või serveri IP
$dbname = 'stenkuita22_etseptiLeht';
$username = 'stenkuita22'; // Asenda oma MySQL kasutajanimega
$password = 'StenCoder22';        // Asenda oma MySQL parooliga

// Ühenduse loomine PDO abil
try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Ühendus andmebaasiga õnnestus!";
} catch (PDOException $e) {
    die("Ühendus ebaõnnestus: " . $e->getMessage());
}
?>