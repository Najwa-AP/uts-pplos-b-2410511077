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

CREATE TABLE `dispositions` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL CHECK (`score` between 1 and 5),
  `feedback` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `nama_unit` varchar(100) DEFAULT NULL,
  `pic_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `dispositions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`);

ALTER TABLE `dispositions`
  ADD CONSTRAINT `dispositions_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`),
  ADD CONSTRAINT `dispositions_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`);

ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`);
COMMIT;