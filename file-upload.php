<?php
$allowedExts = array("gif", "jpeg", "jpg", "png");
$temp = explode(".", $_FILES["file"]["name"]);
$extension = end($temp);

if ((($_FILES["file"]["type"] == "image/gif")
|| ($_FILES["file"]["type"] == "image/jpeg")
|| ($_FILES["file"]["type"] == "image/jpg")
|| ($_FILES["file"]["type"] == "image/pjpeg")
|| ($_FILES["file"]["type"] == "image/x-png")
|| ($_FILES["file"]["type"] == "image/png"))
&& ($_FILES["file"]["size"] < 2000000)
&& in_array($extension, $allowedExts)) {
    if ($_FILES["file"]["error"] > 0) {
        echo json_encode(array('error' => "Return Code: " . $_FILES["file"]["error"]));
    } else {
        $fileName = $_FILES["file"]["name"];
        if (file_exists("assets/" . $fileName)) {
            $fileName .= rand(0, 10000);
        }
        move_uploaded_file($_FILES["file"]["tmp_name"], "assets/" . $fileName);
        echo json_encode(array('success' => "assets/" . $_FILES["file"]["name"]));
    }
} else {
    echo json_encode(array('error' => "Invalid file"));
}
?>
