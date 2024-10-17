<?php
class ConexionDB
{
    private $host = "3.13.193.129";
    private $usuario = "user_cigna";
    private $contrasena = "cigna12369*";
    private $nombreDB = "cigna-convencion";
    private $conexion;

    public function __construct()
    {
        $this->conexion = new mysqli($this->host, $this->usuario, $this->contrasena, $this->nombreDB);
        $this->conexion->set_charset("utf8");

        if ($this->conexion->connect_error) {
            die("Error de conexión: " . $this->conexion->conexionect_error);
        }
    }

    public function insertarRegistro($datos)
    {
        $query = "INSERT INTO suscripcion (nombre, inicial_segundo_nombre, apellido, ciudad, estado, nacionalidad, codigo_cigna, nivel, empresa, 
        posicion, telefono, email, direccion, ciudad_direccion, estado_direccion, codigo_postal, sitio_web, sorteo, evento) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param(
            "sssssssssssssssssii",
            $datos['nombre'],
            $datos['inicial_segundo_nombre'],
            $datos['apellido'],
            $datos['ciudad'],
            $datos['estado'],
            $datos['nacionalidad'],
            $datos['codigo_cigna'],
            $datos['nivel'],
            $datos['empresa'],
            $datos['posicion'],
            $datos['telefono'],
            $datos['email'],
            $datos['direccion'],
            $datos['ciudad_direccion'],
            $datos['estado_direccion'],
            $datos['codigo_postal'],
            $datos['sitio_web'],
            $datos['sorteo'],
            $datos['evento']
        );
        if ($stmt->execute()) {
            return true; // Registro insertado correctamente
        } else {
            return false; // Error al insertar el registro
        }
    }

    public function updateRegistro($datos)
    {
        $query = "UPDATE suscripcion SET nombre=?, inicial_segundo_nombre=?, apellido=?, ciudad=?, estado=?, nacionalidad=?, codigo_cigna=?, nivel=?, empresa=?, 
        posicion=?, telefono=?, email=?, direccion=?, ciudad_direccion=?, estado_direccion=?, codigo_postal=?, sitio_web=?, sorteo=?, evento=? WHERE id=?";
        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param(
            "sssssssssssssssssiii",
            $datos['nombre'],
            $datos['inicial_segundo_nombre'],
            $datos['apellido'],
            $datos['ciudad'],
            $datos['estado'],
            $datos['nacionalidad'],
            $datos['codigo_cigna'],
            $datos['nivel'],
            $datos['empresa'],
            $datos['posicion'],
            $datos['telefono'],
            $datos['email'],
            $datos['direccion'],
            $datos['ciudad_direccion'],
            $datos['estado_direccion'],
            $datos['codigo_postal'],
            $datos['sitio_web'],
            $datos['sorteo'],
            $datos['evento'],
            $datos['id']
        );
        if ($stmt->execute()) {
            return true; // Registro actualizado correctamente
        } else {
            return false; // Error al actualizar el registro
        }
    }

    public function obtenerRegistrosPaginados($offset, $filtro)
    {
        $registrosPorPagina = 10; // Número de registros por página

        $query = "SELECT * FROM suscripcion";

        // Agregar filtro si se proporciona
        if (!empty($filtro)) {
            $query .= " WHERE " . $filtro;
        }

        // Agregar limit y offset para la paginación
        // $query .= " LIMIT " . $registrosPorPagina . " OFFSET " . $offset;

        $result = $this->conexion->query($query);

        if ($result) {
            $registros = array();
            while ($fila = $result->fetch_assoc()) {
                $registros[] = $fila;
            }
            return $registros; // Devolver los registros obtenidos
        } else {
            return false; // Error al obtener los registros
        }
    }

    public function eliminarRegistro($id)
    {
        $query = "DELETE FROM `suscripcion` WHERE id=?";
        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param(
            "s",
            $id
        );
        if ($stmt->execute()) {
            return true; // Registro eliminado correctamente
        } else {
            return false; // Error al eliminar el registro
        }
    }

    public function buscarPorTelefono($telefono)
    {
        // Escapar caracteres especiales para evitar inyección de SQL
        $telefono = $this->conexion->real_escape_string($telefono);

        // Consulta SQL para buscar el registro por el campo 'telefono'
        $sql = "SELECT * FROM suscripcion WHERE telefono LIKE '%$telefono'";

        // Ejecutar la consulta
        $result = $this->conexion->query($sql);

        // Verificar si se encontraron resultados
        if ($result->num_rows > 0) {
            // Iterar sobre los resultados y hacer algo con ellos
            while ($fila = $result->fetch_assoc()) {
                $registros[] = $fila;
            }
            return $registros[0];
        } else {
            // No se encontraron resultados
            return null;
        }

        // Cerrar la conexión
        $this->conexion->close();
    }

    public function buscarPorTelefonoId($telefono, $id)
    {
        // Escapar caracteres especiales para evitar inyección de SQL
        $telefono = $this->conexion->real_escape_string($telefono);
        $parteEntera = intval(ltrim($id, "0"));

        // Consulta SQL para buscar el registro por el campo 'telefono'
        $sql = "SELECT * FROM suscripcion WHERE id = '$parteEntera' AND telefono LIKE '%$telefono' AND evento = '1'";

        // Ejecutar la consulta
        $result = $this->conexion->query($sql);

        // Verificar si se encontraron resultados
        if ($result->num_rows > 0) {
            // Iterar sobre los resultados y hacer algo con ellos
            while ($fila = $result->fetch_assoc()) {
                $registros[] = $fila;
            }
            return $registros[0];
        } else {
            // No se encontraron resultados
            return null;
        }

        // Cerrar la conexión
        $this->conexion->close();
    }

    public function actualizarEvento($id)
    {
        $query = "UPDATE suscripcion SET evento='1' WHERE id=?";
        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param(
            "s",
            $id
        );
        if ($stmt->execute()) {
            return true; // Registro eliminado correctamente
        } else {
            return false; // Error al eliminar el registro
        }
    }
}

$conexionDB = new ConexionDB();
$accion = $_REQUEST['accion'];
$json_data = array();

switch ($accion) {
    case 'insertarRegistro':
        $resultado = $conexionDB->insertarRegistro($_POST);
        break;

    case 'updateRegistro':
        $datos = $_REQUEST['datos'];
        if ($datos['id'] == '') {
            $resultado = $conexionDB->insertarRegistro($_REQUEST['datos']);
        } else {
            $resultado = $conexionDB->updateRegistro($_REQUEST['datos']);
        }
        break;

    case 'obtenerRegistrosPaginados':
        $resultado = $conexionDB->obtenerRegistrosPaginados($_REQUEST['pagina'], $_REQUEST['filtro']);
        break;

    case 'eliminarRegistro':
        $id = $_REQUEST['id'];
        $resultado = $conexionDB->eliminarRegistro($id);
        break;

    case 'buscarPorTelefono':
        $telefono = $_REQUEST['telefono'];
        $resultado = $conexionDB->buscarPorTelefono($telefono);
        break;

    case 'buscarPorTelefonoId':
        $telefono = $_REQUEST['telefono'];
        $id = $_REQUEST['id'];
        $resultado = $conexionDB->buscarPorTelefonoId($telefono, $id);
        break;

    case 'actualizarEvento':
        $id = $_REQUEST['id'];
        $resultado = $conexionDB->actualizarEvento($id);
        break;
}
$json_data['data'] = $resultado;
echo json_encode($json_data);
