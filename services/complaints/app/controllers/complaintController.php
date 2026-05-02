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
            // ambil parameter paging & filtering dari
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

        // buat bikin complaint
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
                // buat Kirim ke Service Logs ---
                $this->sendToLog([
                    "complaint_id" => $id,
                    "action" => "CREATED",
                    "description" => "User " . $this->userData['username'] . " membuat pengaduan baru."
                ]);

                http_response_code(201);
                echo json_encode([
                    "status" => "success", 
                    "message" => "Pengaduan berhasil dibuat"
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "message" => "Gagal menyimpan pengaduan ke database"
                ]);
            }
        }

        // buat input rating complaint
        public function rate() {
            $input = json_decode(file_get_contents("php://input"), true);
            
            if (empty($input['complaint_id']) || empty($input['score'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Id pengaduan & skor rating wajib diisi"
                ]);
                return;
            }

            $complaint = $this->model->getById($input['complaint_id']);
            
            if (!$complaint) {
                http_response_code(404);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Pengaduan tidak ditemukan"
                ]);
                return;
            }

            if ($complaint['status'] !== 'Resolved') {
                http_response_code(400);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Hanya bisa memberi rating jika sudah 'Resolved'"
                ]);
                return;
            }

            $this->model->addRating($input['complaint_id'], $input['score'], $input['feedback']);
            
            echo json_encode([
                "status" => "success", 
                "message" => "Terima kasih atas penilaian anda!"
            ]);
        }

        public function view() {
            // Ambil id dari query string ?id=
            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "message" => "Id pengaduan harus disertakan"
                ]);
                return;
            }

            $result = $this->model->getById($id);

            if ($result) {
                echo json_encode([
                    "status" => "success",
                    "data" => $result
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    "status" => "error",
                    "message" => "Pengaduan tidak ditemukan, silakan masukkan id yang benar"
                ]);
            }
        }

        // buat hapus complaint
        public function destroy() {
            // ambil id dari query string
            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error", 
                    "message" => "ID tidak disertakan"
                ]);
                return;
            }

            if ($this->model->delete($id)) {
                http_response_code(204); 
            } else {
                http_response_code(404);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Gagal menghapus complaint atau ID tidak ada, silakan dicoba lagi"
                ]);
            }
        }

        // interservice (kirim data ke db_logs(service 3))
        private function sendToLog($data) {
        $url = "http://localhost:4003/logs"; // langsung ke port Service Logs
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
        }
}