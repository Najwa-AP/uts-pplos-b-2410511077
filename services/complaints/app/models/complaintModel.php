<?php
    class complaintModel {
        private $conn;
        private $table_name = "complaints";

        public function __construct($db) {
            $this->conn = $db;
        }

        // buat ambil data pake relasi & paging & filter
        public function getAll($page, $per_page, $unit_id = null, $status = null) {
            $offset = ($page -1) * $per_page;

            // Query SQL dengan JOIN ke tabel units dan ratings (opsional) (gk tau mesti pake apa gk)
            $query = "SELECT c.*, u.nama_unit, r.score as rating_skor 
                  FROM " . $this->table_name . " c 
                  LEFT JOIN units u ON c.unit_id = u.id 
                  LEFT JOIN ratings r ON c.id = r.complaint_id";
            
            // buat filter
            $conditions = []; 
            if ($unit_id) $conditions[] = "c.unit_id = :unit_id";
            if ($status) $conditions[] = "c.status = :status";
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }

            $query .= " ORDER BY c.id DESC LIMIT :limit OFFSET :offset";
            
            // binding data
            $result = $this->conn->prepare($query);
            $result->bindValue(':limit', (int)$per_page, PDO::PARAM_INT);
            $result->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            if ($unit_id) $result->bindValue(':unit_id', $unit_id);
            if ($status) $result->bindValue(':status', $status);
            
            $result->execute();
            return $result->fetchAll(PDO::FETCH_ASSOC);
        }

        // buat simpan complaint
        public function create($data) {
            $query = "INSERT INTO " . $this->table_name . "
                (user_id, unit_id, title, description, status) 
                VALUES (:user_id, :unit_id, :title, :description, 'Pending')";

            $result = $this->conn->prepare($query);
            $result->execute([
                ':user_id' => $data['user_id'],
                ':unit_id' => $data['unit_id'],
                ':title' => $data['title'],
                ':description' => $data['description']
            ]);
            return $this->conn->lastInsertId();
        }
    }
?>