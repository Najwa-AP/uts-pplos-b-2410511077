CREATE DATABASE IF NOT EXISTS db_auth;
USE db_auth;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `token_blacklist` (
  `id` int(11) NOT NULL,
  `token` varchar(768) NOT NULL,
  `blacklisted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Mahasiswa','Admin','Unit') DEFAULT 'Mahasiswa',
  `github_id` varchar(100) DEFAULT NULL,
  `profile_pic` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `oauth_provider` varchar(50) DEFAULT 'local'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `nama`, `username`, `email`, `password`, `role`, `github_id`, `profile_pic`, `created_at`, `oauth_provider`) VALUES
(1, 'Najwa-AP', 'Najwa-AP', 'Najwa-AP@github.com', '', 'Mahasiswa', '194593121', 'https://avatars.githubusercontent.com/u/194593121?v=4', '2026-04-29 04:52:06', 'github'),
(2, '', 'nanaz_goreng', 'naz@upnvj.ac.id', '$2b$10$JH0I4p50KJIBOeSPo.p3P.TzE3G7YN8OYpbAw1r1eH3umUieVDI.2', 'Mahasiswa', NULL, NULL, '2026-05-02 03:06:54', 'local'),
(6, '', 'Najwa_zahra', 'najwa@upnvj.ac.id', '$2b$10$AVzjQL4IvaNrufyEz3uqN.w.rSpY4zj4/ZrrqtllebWA1IJqS3NSC', 'Mahasiswa', NULL, NULL, '2026-05-02 07:45:01', 'local');

ALTER TABLE `token_blacklist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `password` (`password`),
  ADD UNIQUE KEY `github_id` (`github_id`);

ALTER TABLE `token_blacklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;