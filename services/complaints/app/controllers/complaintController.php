<?php
    class ComplaintController {
        private $model;
        private $userData;

        public function __construct($db) {
            $this->model = new ComplaintModel($db);
            
            // ambil data user yang sudah diverifikasi gateway dari header
            $headerData = $_SERVER['HTTP_X_USER_DATA'] ?? null;
            $this->userData = $headerData ? json_decode($headerData, true) : null;
        }

        public function list() {
            // ambil parameter paging & filtering dari $_GET
            $page = $_GET['page'] ?? 1;
            $per_page = $_GET['per_page'] ?? 10;
            $unit_id = $_GET['unit_id'] ?? null;
            $status = $_GET['status'] ?? null;

            $results = $this->model->getAll($page, $per_page, $unit_id, $status);

            echo json_encode([
                "status" => "success",
                "message" => "Data pengaduan berhasil diambil",
                "page" => (int)$page,
                "per_page" => (int)$per_page,
                "data" => $results
            ]);
        }

        public function create() {
            // ambil body request json
            $input = json_decode(file_get_contents("php://input"), true);

            // validasi  
            if (empty($input['title']) || empty($input['description']) || empty($input['unit_id'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Data tidak lengkap"
                ]);
                return;
            }

            // input user_id dari gateway
            $input['user_id'] = $this->userData['id'];

            $id = $this->model->create($input);
            
            if ($id) {
                // buat logging
                echo json_encode([
                    "status" => "success", 
                    "message" => "Pengaduan berhasil dibuat",
                    "complaint_id" => $id
                ]);
            }
        }
}