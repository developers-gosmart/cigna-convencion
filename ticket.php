<?php

// -------------------------------------------------------------------------
// DEBUGGING SECTION: Mostrar todos los errores de PHP para facilitar la depuración
// Eliminar esta sección cuando el código esté en producción
// -------------------------------------------------------------------------
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// -------------------------------------------------------------------------

// Incluir la librería TCPDF
require_once('assets/tcpdf/tcpdf.php');

// Clase personalizada que extiende TCPDF para manejar el diseño de la página
class TicketPDF extends TCPDF
{
  // Ocultar Header por defecto
  public function Header()
  {
    // Vacío para no mostrar header por defecto
  }

  // Ocultar Footer por defecto
  public function Footer()
  {
    // Vacío para no mostrar footer por defecto
  }
}

// ----------------------------------------------------
// CONFIGURACIÓN DE LA BASE DE DATOS
// ----------------------------------------------------
$host = "45.22.208.167";
$user = "user_admin";
$pass = "Useradmin12369*";
$dbname = "cigna-convencion";

// Rutas temporales para la descarga del QR y del Background
$temp_dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR;

// ----------------------------------------------------
// FUNCIÓN PARA MOSTRAR ERRORES EN HTML
// ----------------------------------------------------
function displayError($title, $message)
{
  echo "<html><body style='font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f8f8f8;'>";
  echo "<div style='border: 1px solid #ffcc00; padding: 15px; border-radius: 5px; background-color: #fff9e6;'>";
  echo "<h2>❌ " . htmlspecialchars($title) . "</h2>";
  echo "<p>" . nl2br(htmlspecialchars($message)) . "</p>";
  echo "</div>";
  echo "</body></html>";
  exit;
}

function truncarTexto($texto, $maxCaracteres = 25)
{
  if (mb_strlen($texto, 'UTF-8') > $maxCaracteres) {
    return mb_substr($texto, 0, $maxCaracteres, 'UTF-8') . '...';
  }
  return $texto;
}

// Crear conexión
$conn = new mysqli($host, $user, $pass, $dbname);

// Verificar conexión
if ($conn->connect_error) {
  displayError(
    "Error de Conexión a la Base de Datos",
    "No se pudo conectar: " . $conn->connect_error . "\nPor favor, verifica los parámetros de conexión."
  );
}

// Obtener el ID del agente y validar
$agente_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($agente_id <= 0) {
  displayError(
    "Error: ID de Agente no Válido",
    "Por favor, proporciona un ID válido en la URL (ejemplo: ticket.php?id=123)."
  );
}

// --- Rutas y variables para QR ---
$temp_qr_file = $temp_dir . 'qr_' . $agente_id . '.png';
$qr_image_url = '';
$qr_image_used_path = '';
$qr_loaded_successfully = false;

// --- Variables para el Background ---
// URL de la imagen de fondo (WebP)
$bg_image_url = 'https://firebasestorage.googleapis.com/v0/b/test-2-12b91.appspot.com/o/imagenes%2Fversion%20ticket%20%20EMPOWER_EVENTO%20final-02-02.png?alt=media&token=3b123234-3834-4a7b-a2fc-d0b493328c8e';
// --- NOTA: WebP puede fallar en Image(). Si falla, cambiar a .png o .jpg ---
$temp_bg_file = $temp_dir . 'bg_' . $agente_id . '.webp';
$bg_loaded_successfully = false;


// ----------------------------------------------------
// BÚSQUEDA DE DATOS DEL AGENTE
// ----------------------------------------------------
$sql = "SELECT concat_ws(' ', s.nombre, s.apellido) AS nombre, s.code, s.type_tickets, i.imagen 
        FROM suscripcion_2025 s 
        INNER JOIN imagenes i ON i.id_suscriptor = s.id 
        WHERE s.id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
  displayError("Error de Preparación de Consulta", "Fallo al preparar la consulta SQL: " . $conn->error);
}

$stmt->bind_param("i", $agente_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
  $stmt->close();
  $conn->close();
  displayError(
    "Error: Agente no Encontrado",
    "No se encontró el agente con ID: " . $agente_id . " en la base de datos."
  );
}

$agente = $result->fetch_assoc();

$agente_nombre = truncarTexto(htmlspecialchars($agente['nombre']), 25);
$agente_code = $agente['code'];
$agente_ticket = htmlspecialchars($agente['type_tickets']);
$qr_image_url = $agente['imagen'];

$stmt->close();


// ----------------------------------------------------
// PASO CLAVE: DESCARGAR IMÁGENES TEMPORALMENTE
// ----------------------------------------------------

// 1. Descargar QR
if (!empty($qr_image_url)) {
  $image_data = @file_get_contents($qr_image_url);
  if ($image_data !== false) {
    if (file_put_contents($temp_qr_file, $image_data) !== false) {
      $qr_image_used_path = $temp_qr_file;
      $qr_loaded_successfully = true;
    }
  }
}

// 2. Descargar Background (WebP)
$bg_image_used_path = '';
if (!empty($bg_image_url)) {
  $bg_data = @file_get_contents($bg_image_url);
  if ($bg_data !== false) {
    if (file_put_contents($temp_bg_file, $bg_data) !== false) {
      $bg_image_used_path = $temp_bg_file;
      $bg_loaded_successfully = true;
    }
  }
}

// ----------------------------------------------------
// GENERACIÓN DEL PDF
// ----------------------------------------------------

// Crear nuevo PDF
// Formato (Ancho, Alto): 200mm x 120mm
$pdf = new TicketPDF('L', 'mm', array(200, 120), true, 'UTF-8', false);

// Configurar metadatos del documento
$pdf->SetCreator(PDF_CREATOR);
$pdf->SetAuthor('EMPOWER 2025');
$pdf->SetTitle('Ticket EMPOWER - ' . $agente_nombre);
$pdf->SetSubject('Ticket de evento');

// Eliminar header y footer por defecto
$pdf->setPrintHeader(false);
$pdf->setPrintFooter(false);

// Establecer márgenes (5mm en todos los lados)
$pdf->SetMargins(5, 5, 5);
$pdf->SetAutoPageBreak(FALSE, 0); // Deshabilitar salto de página automático

// Agregar página
$pdf->AddPage();


// ----------------------------------------------------
// PASO CLAVE: INSERTAR IMAGEN DE FONDO CON Image()
// ----------------------------------------------------
if ($bg_loaded_successfully) {
  // Insertamos la imagen al 100% del tamaño del documento (200x120mm)
  // Coordenadas: (X=0, Y=0), Ancho=200, Alto=120
  // Tipo: Si .webp falla, pruebe con 'JPEG' o cambie el archivo a JPG/PNG.
  $pdf->Image(
    $temp_bg_file,
    0,
    0,
    200,
    120,
    '', // Dejar vacío para autodetección o especificar 'WEBP' si su TCPDF lo soporta
    '',
    '',
    false,
    300,
    '',
    false,
    false,
    0,
    false,
    false,
    false
  );
} else {
  // Si la imagen de fondo falla, pintamos un rectángulo negro como fallback
  $pdf->SetFillColor(45, 45, 45); // Color #2d2d2d
  $pdf->Rect(0, 0, 200, 120, 'F');
}
// ----------------------------------------------------


// ----------------------------------------------------
// CÓDIGO HTML PARA EL TICKET (CONTENIDO)
// ----------------------------------------------------
// Resetear la posición X, Y para que el contenido HTML se dibuje encima del fondo
$pdf->SetXY(5, 5); // Márgenes de 5mm

$html = '
    <style>
        /* Estilos principales */
        .container {
            width: 190mm; /* 200mm - 10mm de margen */
            height: 110mm; /* 120mm - 10mm de margen */
            border: 1px solid #ddd;
            padding: 0; /* Ya no necesitamos padding si el fondo lo maneja la imagen */
            /* IMPORTANTE: Eliminamos el background-image y background-color del CSS */
        }
        .nombre {
            font-family: helvetica;
            font-weight: bold;
            font-size: 36px;
            color: #d4af37; /* Color Dorado */
            text-align: left;
            margin-bottom: 5px;
        }
        .tipo {
            font-family: helvetica;
            font-weight: bold;
            font-size: 16px;
            color: #ffffff;
            text-align: left;
        }
        .codigo-agente {
            font-family: helvetica;
            font-weight: bold;
            font-size: 14px;
            color: #ffffff;
            text-align: center;
            margin-top: 5px;
        }
        .texto-arriba {
            padding-bottom: 300px;
        }
    </style>

    <!-- Texto superior -->
    <div class="texto-arriba">
        <br>
    </div>

    <!-- Contenedor principal del ticket (solo actúa como contenedor de texto) -->
    <div class="container">
        <!-- Contenedor de Información (Izquierda) -->
        <table cellpadding="0" cellspacing="0" border="0" style="width: 60%;">
            <tr>
                <td style="height: 50mm; vertical-align: middle;">
                    <div class="nombre">' . $agente_nombre . '</div>
                    <div class="tipo">' . $agente_ticket . '</div>
                </td>
            </tr>
        </table>
    </div>';

// Escribir HTML en el PDF
$pdf->writeHTML($html, true, false, true, false, '');


// ----------------------------------------------------
// CÓDIGO QR: Usar la función Image() para el QR
// ----------------------------------------------------

$qr_size = 35; // Tamaño del QR en mm 
$x_coord = 145; // Posición X para el lado derecho
$y_coord = 35; // AJUSTE: Subí el QR de 52.5 a 45 (7.5mm más arriba)

// Estilo de borde dorado (RGB 212, 175, 55)
$border_style = array('LTRB' => array('width' => 0.5, 'cap' => 'butt', 'join' => 'miter', 'dash' => 0, 'color' => array(212, 175, 55)));

if ($qr_loaded_successfully) {
  // Si la descarga a la ruta temporal fue exitosa, insertamos la imagen
  $pdf->Image(
    $qr_image_used_path,
    $x_coord,
    $y_coord,
    $qr_size,
    $qr_size,
    'PNG',     // Tipo de imagen
    '',         // Link (Aseguramos que sea string)
    'T',        // Align
    false,      // Resize
    300,        // DPI
    '',         // Alinh
    false,      // ismask
    false,      // imgmask
    $border_style, // Border (Este es el array que debe ir en el 14to argumento)
    false,      // fitbox
    false,      // fnc
    false       // local_only
  );

  // ----------------------------------------------------
  // NUEVO: AGREGAR CÓDIGO DEL AGENTE DEBAJO DEL QR
  // ----------------------------------------------------
  $pdf->SetTextColor(255, 255, 255); // Color blanco
  $pdf->SetFont('helvetica', 'B', 14);

  // Calcular posición Y para el código (debajo del QR)
  $codigo_y = $y_coord + $qr_size + 3; // QR Y + altura QR + 3mm de separación

  // Escribir el código del agente centrado debajo del QR
  $pdf->SetXY($x_coord, $codigo_y);
  $pdf->Cell($qr_size, 8, $agente_code, 0, 1, 'C', false, '', 0, false, 'T', 'M');
} else {
  // Mensaje de fallback si la descarga o la carga fallaron
  $pdf->SetTextColor(194, 194, 194);
  $pdf->SetFont('helvetica', '', 8);
  // Establecer la posición para el fallback QR
  $pdf->SetXY($x_coord, $y_coord);
  $pdf->writeHTMLCell(
    $qr_size,
    $qr_size,
    '',
    '',
    '<div style="text-align:center; border:2px solid #d4af37; border-radius: 8px; padding: 2px; line-height: 1.2;">
            ❌ ERROR QR: No se pudo descargar la imagen. URL: ' . substr($qr_image_url, 0, 15) . '...
        </div>',
    0,
    1,
    false,
    true,
    'C',
    true
  );
  $pdf->SetTextColor(0); // Restablecer color
}


// Salida del PDF: 'I' para mostrar en el navegador
$pdf->Output('ticket_empower_' . $agente_id . '.pdf', 'I');


// ----------------------------------------------------
// LIMPIEZA: Eliminar los archivos temporales
// ----------------------------------------------------
if (file_exists($temp_qr_file)) {
  @unlink($temp_qr_file);
}
if (file_exists($temp_bg_file)) {
  @unlink($temp_bg_file);
}

$conn->close();
