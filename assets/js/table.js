var preloader = document.getElementById("preloader");
var turno = 1;
const estados = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AS", label: "American Samoa" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FM", label: "Federated States of Micronesia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "GU", label: "Guam" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PW", label: "Palau" },
  { value: "PA", label: "Pennsylvania" },
  { value: "PR", label: "Puerto Rico" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VI", label: "Virgin Islands" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];

$(document).ready(function () {
  $("#buscar_telefono").keydown(function (event) {
    if (event.keyCode == 13) {
      event.preventDefault(); // Esto evita que se realice la acción por defecto del "Enter" en el input
      if (event.target.value == "12369") {
        $("#editarModal").modal("show");
        $("#validacionModal").modal("hide");
      }
    }
  });

  var tabla = $("#tablaDatos").DataTable({
    processing: true,
    language: {
      search: "Buscar:",
      info: "Mostrando la página _PAGE_ de _PAGES_",
      paginate: {
        first: "Primero",
        last: "Ultimo",
        next: "Siguiente",
        previous: "Anterior",
      },
      buttons: {
        pageLength: {
          _: "Mostrar %d elementos",
        },
      },
    },
    dom: "Bfrtip",
    buttons: [
      "pageLength",
      {
        extend: "csvHtml5",
      },
      {
        text: "Sorteo",
        action: function (e, dt, node, config) {
          window.location.href = "lottery.html";
        },
      },
      {
        text: "Asistencia",
        action: function (e, dt, node, config) {
          calcAsistencia();
        },
      },
    ],
    ajax: {
      url: "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/list",
      dataSrc: "data",
      data: {
        accion: "obtenerRegistrosPaginados",
        pagina: 0,
        filtro: "",
      },
    },
    columns: [
      { data: "id", visible: false },
      {
        data: null,
        render: function (data, type, row) {
          return completarConCeros(data.id);
        },
      },
      { data: "nombre" },
      { data: "inicial_segundo_nombre", visible: false },
      { data: "apellido" },
      { data: "codigo_cigna", visible: false },
      { data: "ciudad", visible: false },
      { data: "estado", visible: false },
      { data: "nacionalidad", visible: false },
      { data: "nivel", visible: false },
      { data: "empresa", visible: false },
      { data: "posicion", visible: false },
      { data: "telefono" },
      { data: "email" },
      { data: "direccion", visible: false },
      { data: "ciudad_direccion", visible: false },
      { data: "estado_direccion", visible: false },
      { data: "codigo_postal", visible: false },
      { data: "sitio_web", visible: false },
      { data: "sorteo", visible: false },
      { data: "meal" },
      {
        data: null,
        render: function (data, type, row) {
          return data.is_vip == 1 ? "Si" : "No";
        },
      },
      {
        data: null,
        render: function (data, type, row) {
          return data.evento == 1 ? "Registrado" : "Registrar";
        },
      },
      {
        data: null,
        render: function (data, type, row) {
          let color = "warning";
          let nombreButton = "Registrar";
          if (data.evento == 1) {
            color = "success";
            nombreButton = "Registrado";
          }
          return `<div class="btn-group" role="group" aria-label="Button group with nested dropdown">
              <button type="button" class="registradoBtn btn btn-${color}">${nombreButton}</button>
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  Más
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item editarBtn" href="#">Editar</a></li>
                  <li><a class="dropdown-item eliminarBtn" href="#">Eliminar</a></li>
                </ul>
              </div>
            </div>`;
        },
      },
    ],
    drawCallback: function (settings) {
      console.log(settings.json);
    },
  });

  $("#tablaDatos tbody").on("click", ".editarBtn", function () {
    limpiar();
    var data = tabla.row($(this).parents("tr")).data();
    $("#registroId").val(data.id);
    $("#nombre").val(data.nombre);
    $("#inicial_segundo_nombre").val(data.inicial_segundo_nombre);
    $("#apellido").val(data.apellido);
    $("#ciudad").val(data.ciudad);
    $("#estado").val(data.estado);
    $("#nacionalidad").val(data.nacionalidad);
    $("#codigo_cigna").val(data.codigo_cigna);
    $("#code").val(data.code);
    $("#meal").val(data.meal);
    $("#empresa").val(data.empresa);
    $("#nivel").val(data.nivel);
    $("#posicion").val(data.posicion);
    $("#telefono").val(data.telefono);
    $("#email").val(data.email);
    $("#direccion").val(data.direccion);
    $("#ciudad_direccion").val(data.ciudad_direccion);
    $("#estado_direccion").val(data.estado_direccion);
    $("#codigo_postal").val(data.codigo_postal);
    $("#sitio_web").val(data.sitio_web);
    $("#sorteo").prop("checked", data.sorteo == 1);
    $("#evento").prop("checked", data.evento == 1);
    $("#is_vip").prop("checked", data.is_vip == 1);
    $("#editarModal").modal("show");
  });

  $("#tablaDatos tbody").on("click", ".registradoBtn", function () {
    var data = tabla.row($(this).parents("tr")).data();
    if (data.evento == 0) {
      preloader.style.display = "block";
      const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/event";
      const params = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data.id,
        }),
      };

      fetch(url, params)
        .then((response) => response.text())
        .then((response) => {
          preloader.style.display = "none";
          const data = JSON.parse(response);
          if (data.code == 200) {
            tabla.ajax.reload();
            Swal.fire({
              title: "exitoso",
              text: "Se registro exitosamente",
              icon: "success",
            });
          } else {
            Swal.fire({
              title: "Error",
              text: "Hubo un error en la petición",
              icon: "error",
            });
          }
          preloader.style.display = "none";
        });
    }
  });

  $("#tablaDatos tbody").on("click", ".eliminarBtn", function () {
    Swal.fire({
      title: "Usted esta seguro de eliminar el subcriptor?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        preloader.style.display = "block";
        var data = tabla.row($(this).parents("tr")).data();
        const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion";
        const params = {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data.id,
          }),
        };

        fetch(url, params)
          .then((response) => response.text())
          .then((response) => {
            const data = JSON.parse(response);
            if (data.code == 200) {
              tabla.ajax.reload();
              console.log("despues", response);
              preloader.style.display = "none";
              Swal.fire({
                title: "exitoso",
                text: "exitoso",
                icon: "success",
              });
            } else {
              Swal.fire({
                title: "Error",
                text: "Hubo un error en la petición",
                icon: "error",
              });
            }
          });
      }
    });
  });

  $("#guardarCambiosBtn").click(function () {
    preloader.style.display = "block";

    let mensaje = "";
    if ($("#registroId").val() != "") {
      mensaje = "El registro ha sido actualizado exitosamente";
    } else {
      mensaje = "El registro ha sido ingresado exitosamente";
    }

    var data = tabla.row($(this).parents("tr")).data();
    const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion";
    const params = {
      method: $("#registroId").val() != "" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: $("#registroId").val(),
        nombre: $("#nombre").val(),
        inicial_segundo_nombre: $("#inicial_segundo_nombre").val(),
        apellido: $("#apellido").val(),
        ciudad: $("#ciudad").val(),
        estado: $("#estado").val(),
        nacionalidad: $("#nacionalidad").val(),
        codigo_cigna: $("#codigo_cigna").val(),
        code: $("#code").val(),
        meal: $("#meal").val(),
        empresa: $("#empresa").val(),
        nivel: $("#nivel").val(),
        posicion: $("#posicion").val(),
        telefono: $("#telefono").val(),
        email: $("#email").val(),
        direccion: $("#direccion").val(),
        ciudad_direccion: $("#ciudad_direccion").val(),
        estado_direccion: $("#estado_direccion").val(),
        codigo_postal: $("#codigo_postal").val(),
        sitio_web: $("#sitio_web").val(),
        sorteo: $("#sorteo").is(":checked") ? 1 : 0,
        evento: $("#evento").is(":checked") ? 1 : 0,
        is_vip: $("#is_vip").is(":checked") ? 1 : 0,
      }),
    };

    fetch(url, params)
      .then((response) => response.text())
      .then((response) => {
        const data = JSON.parse(response);
        if (data.code == 200) {
          tabla.ajax.reload();
          console.log("despues", response);
          preloader.style.display = "none";
          Swal.fire({
            title: "exitoso",
            text: mensaje,
            icon: "success",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: "Hubo un error en la petición",
            icon: "error",
          });
        }
      });

    // Cierra la modal
    $("#editarModal").modal("hide");
  });

  $("#modalAgregarBtn").click(function () {
    limpiar();
    $("#editarModal").modal("show");
  });

  $("#confirmarBtn").click(function () {
    if ($("#buscar_telefono").val() == "12369") {
      $("#editarModal").modal("show");
      $("#validacionModal").modal("hide");
    }
  });

  function calcAsistencia() {
    tabla.ajax.reload(function () {
      var data = tabla.rows().data().toArray();
      var count = data.filter(row => row.evento === 1).length;
      Swal.fire({
        title: "Asistencia!",
        text: `Registrados: ${count}`,
        icon: "success",
      });
    });

  }

  function llenarSelects() {
    const selects = document.querySelectorAll('.estado-select');
    selects.forEach(select => {
      estados.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado.value;
        option.textContent = estado.label;
        select.appendChild(option);
      });
    });
  }

  llenarSelects();

});

function completarConCeros(cadena) {
  while (cadena.length < 3) {
    cadena = "0" + cadena;
  }
  return cadena;
}

function limpiar() {
  $("#registroId").val("");
  $("#nombre").val("");
  $("#inicial_segundo_nombre").val("");
  $("#apellido").val("");
  $("#ciudad").val("");
  $("#estado").val("");
  $("#nacionalidad").val("");
  $("#codigo_cigna").val("");
  $("#empresa").val("");
  $("#nivel").val("");
  $("#posicion").val("");
  $("#telefono").val("");
  $("#email").val("");
  $("#direccion").val("");
  $("#ciudad_direccion").val("");
  $("#estado_direccion").val("");
  $("#codigo_postal").val("");
  $("#sitio_web").val("");
  $("#code").val("");
  $("#meal").val("");
  $("#is_vip").prop("checked", false);
  $("#sorteo").prop("checked", false);
  $("#evento").prop("checked", false);
  $("#buscar_telefono").val("");
}
