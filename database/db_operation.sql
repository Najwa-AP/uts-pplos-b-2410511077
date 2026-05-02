CREATE DATABASE IF NOT EXISTS db_operation;
USE db_operation;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Pending','OnProgress','Resolved','Rejected') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `complaints` (`id`, `user_id`, `unit_id`, `title`, `description`, `status`) VALUES
(1, 101, 1, 'Internet Mati', 'Wifi di lantai 2 FIK-LAB 304 mati total dari pagi.', 'Pending'),
(2, 102, 2, 'AC Bocor', 'AC di ruangan fik 201 netes air terus.', 'OnProgress'),
(3, 101, 1, 'Gagal Login', 'Sistem login mahasiswa muter-muter di menu.', 'Resolved'),
(4, 103, 3, 'KRS Error', 'Menu KRS tidak muncul di portal SIAKAD.', 'Pending'),
(5, 2, 1, 'Lampu Kelas Mati', 'Lampu di ruang kuliah 403 berkedip dan mengganggu saat UTS.', 'Pending'),
(6, 403, 1, 'TV Mati', 'TV di lantai di FIK-LAB 204 mati dari sore.', 'Resolved'),
(7, 20, 2, 'Plafon Bocor', 'atap di ruangan fik 301 netes air hujan.', 'OnProgress'),
(8, 231, 1, 'Gagal login PRESMA', 'Sistem login muter-muter terus di menu.', 'Resolved'),
(9, 123, 3, 'SIAKAD Down', 'portal SIAKAD down padahal lagi mau isi KRS.', 'Pending'),
(10, 32, 1, 'Mic Mati', 'Mic di ruang FIK-LAB 200 gak bisa nyala.', 'Pending'),
(12, 6, 1, 'Lampu Kelas Mati', 'Lampu di ruang kuliah 403 berkedip dan mengganggu saat UTS.', 'Pending'),
(13, 5, 2, 'Lampu HAti Mati', 'Lampu di ruang kuliah 403 berkedip dan mengganggu saat UTS.', 'Pending');

CREATE TABLE `dispositions` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `dispositions` (`id`, `complaint_id`, `unit_id`, `note`, `created_at`) VALUES
(1, 2, 2, 'Tolong segera dicek oleh teknisi AC.', '2026-05-01 06:04:19');

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL CHECK (`score` between 1 and 5),
  `feedback` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `ratings` (`id`, `complaint_id`, `score`, `feedback`) VALUES
(3, 6, 5, 'Terima kasih, TV nya sudah bisa dipakai lagi.'),
(4, 6, 5, 'Terima kasih, TV nya sudah bisa dipakai lagi.');

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `nama_unit` varchar(100) DEFAULT NULL,
  `pic_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `units` (`id`, `nama_unit`, `pic_name`) VALUES
(1, 'Unit IT', 'Budi Tech'),
(2, 'Unit Sarpras', 'Naz Fasilitas'),
(3, 'Unit Akademik', 'Willem Dosen');

ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unit_id` (`unit_id`);

ALTER TABLE `dispositions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `complaint_id` (`complaint_id`);

ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complaint_id` (`complaint_id`);

ALTER TABLE `units`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

ALTER TABLE `dispositions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`);

ALTER TABLE `dispositions`
  ADD CONSTRAINT `dispositions_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`),
  ADD CONSTRAINT `dispositions_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`);

ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`);
COMMIT;