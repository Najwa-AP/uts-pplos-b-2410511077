CREATE DATABASE IF NOT EXISTS db_logs;
USE db_logs;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `complaint_logs` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `complaint_logs` (`id`, `complaint_id`, `action`, `description`, `created_at`) VALUES
(1, 5, 'CREATED', 'User nanaz_goreng membuat pengaduan baru.', '2026-05-02 03:55:43'),
(2, 1, 'CREATED', 'User mhs_1 membuat pengaduan: Internet Mati', '2026-05-02 05:30:32'),
(3, 2, 'UPDATED', 'Admin mengubah status pengaduan menjadi In Progress', '2026-05-02 05:30:32'),
(4, 4, 'CREATED', 'User Najwa-AP membuat pengaduan: KRS Error', '2026-05-02 05:30:32'),
(5, 3, 'RESOLVED', 'Petugas telah memperbaiki sistem login dan menutup laporan', '2026-05-02 05:30:32'),
(6, 6, 'RATED', 'User memberikan rating 5 terhadap penanganan TV', '2026-05-02 05:30:32'),
(8, 12, 'CREATED', 'User Najwa_zahra membuat pengaduan baru.', '2026-05-02 07:48:12'),
(9, 12, 'UPDATE', 'Mhs5 membuat pengaduan: Lampu Lab Mati.', '2026-05-02 08:30:17');

ALTER TABLE `complaint_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complaint_id` (`complaint_id`);

ALTER TABLE `complaint_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;