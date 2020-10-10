var app = (function () {
    var cinemaSeleccionado = "";
    var fecha = "";
    var fechaCompleta = "";
    var seatslocal = [];
    var archivo = apiclient;
    var nombrePelicula = "";
    let stompClient = null;
    var isListen = true; 

    class Seat {
      constructor(row, col) {
          this.row = row;
          this.col = col;
      }
  }
  var connectAndSubscribe = function (callback) {
    console.info('Connecting to WS...');
    var socket = new SockJS('/stompendpoint');
    stompClient = Stomp.over(socket);

    //subscribe to /topic/TOPICXX when connections succeed
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/buyticket.'+cinemaSeleccionado+"."+fecha+"."+nombrePelicula , function (message) {
           var theObject=JSON.parse(message.body);
           callback();

        });
    });

};
    var verifyAvailability = function (row,col) {
      var st = new Seat(row, col);
      if (seatslocal[row][col]){
          apiclient.actualizarSeats(cinemaSeleccionado, nombrePelicula, fechaCompleta, row, col, repintar); 
          console.info("purchased ticket");
          stompClient.send("/topic/buyticket."+cinemaSeleccionado+"."+fecha+"."+nombrePelicula, {}, JSON.stringify(st)); 
          
      }
      else{
          console.info("Ticket not available");
      }  

    };
    var buyTicket = function (row, col) {
      console.info("buying ticket at row: " + row + "col: " + col);
      verifyAvailability(row,col);
      
    }

    conect = function(){
      connectAndSubscribe(repintar);
    }

    setCinema = function(){
      cinemaSeleccionado = $("#name").val();
      $("#name").val("");
    }
    setFecha = function(){
      fecha = $("#Fecha").val();
      $("#Fecha").val("");
    }

    actulizarFunciones = function(){
      archivo.getFunctionsByCinemaAndDate(cinemaSeleccionado, fecha, mapObjetos);
      $("#cineSelect").text("Cinema selected: "+cinemaSeleccionado);
    }
    
    var mapObjetos = function (listados){
      $("#cuerpo").html("");
      var nombre = listados.map(function(listado){
          $("#tabla > tbody").append(
            `<tr>
                    <td>${listado.movie.name}</td>
                    <td>${listado.movie.genre}</td>
                    <td>${listado.date}</td>
                    <td><button type="button" onclick="app.getSeats('${listado.movie.name}','${listado.date}'), app.conect()" class="btn btn-primary">Open Seats</button></td>"
            </tr>`
          );
      })

    }
    var getMousePosition = function (evt) {
      if(isListen){
          isListen = false;
          $('#myCanvas').click(function (e) {
              var rect = myCanvas.getBoundingClientRect();
              var x = e.clientX - rect.left;
              var y = e.clientY - rect.top;
              verifySeats(x,y);
          });
      }
    }
    var verifySeats = function(row,col){
      var c = document.getElementById("myCanvas");
      var ctx = c.getContext("2d");
      const pixel = ctx.getImageData(row, col, 1, 1).data;
      if(pixel[1]===153 && pixel[3]===255){
          seatCalculate(row,col);
          
      }
      if(pixel[0]===255 && pixel[3]===255)
          alert("Este asiento esta ocupado");
  }
  var seatCalculate = function(x,y){
    var row,col,limiteX1;
    var limiteY1;
    var limiteX;
    var limiteY;
    var parar = true; 
    for (var i = 0; i < seatslocal[0].length && parar; i++) {
        for (var j = 0; j < seatslocal.length && parar; j++) {
            limiteX = i * 70 + 25;
            limiteY = j * 70 + 120;
            limiteX1 = i * 70 + 25 + 40;
            limiteY1 = j * 70 + 120 + 40;
            if (x >= limiteX && x <= limiteX1 && y >= limiteY && y <= limiteY1) {
                row = j;
                col = i;
                console.log(row);
                console.log(col);
                parar = false;
                verifyAvailability(row, col);
            }
        }
    }
  } 
    repintar = function(){
      archivo.getFunctionByNameAndDate(cinemaSeleccionado, fechaCompleta, nombrePelicula, drawSeats);
    }
    functionseats = function(movie, fechaFuncion){
      nombrePelicula = movie;
      fechaCompleta = fechaFuncion;
      Listafecha = fechaCompleta.split(" ");
      fecha = Listafecha[0];
      archivo.getFunctionByNameAndDate(cinemaSeleccionado, fechaCompleta, movie, drawSeats);
    }

    drawSeats = function(datos){
      seatslocal = datos.seats;
      var c = document.getElementById("myCanvas");
      var lapiz = c.getContext("2d");
      lapiz.fillStyle = "#0531ae";
      lapiz.fillRect(20, 20 , 820, 20);
      lapiz.beginPath();
      for (var i = 0; i < seatslocal[0].length; i++) {
        for (var j = 0; j < seatslocal.length; j++) {
          lapiz.fillStyle = "#FF0000";  
          if(seatslocal[j][i]){
            lapiz.fillStyle = "#009900"
          }
          lapiz.fillRect(i*70+25, j*70+120, 40, 40);
        }
      }
    }

    setFunction = function (){
      var newHora= $("#newHour").val();
      console.log($("#newHour").val());
      if($("#newHour").val() === ""){
        if($("#Pelicula").val() !== "" || $("#genero").val() !== "" || $("#hour").val() !== ""){
          apiclient.newFunction(cinemaSeleccionado, $("#Pelicula").val(), $("#genero").val(), fecha+" "+$("#hour").val(), actulizarFunciones);
        }
      }else{
        archivo.setFunctionByNameAndDate(cinemaSeleccionado, nombrePelicula, fecha+" "+newHora, fechaCompleta, actulizarFunciones)
      }
    }

    formulario = function (){
      document.getElementById("formulario").style.display ="block";
      var c = document.getElementById("myCanvas");
      var lapiz = c.getContext("2d");
      lapiz.clearRect(0, 0, c.width, c.height);
    }

    deleteFunction = function(){
      apiclient.deleteFunction(cinemaSeleccionado, nombrePelicula, fechaCompleta, actulizarFunciones);
    }
  return {
    setCinema: setCinema,
    setFecha: setFecha,
    actulizarFunciones: actulizarFunciones,
    cambiarFuncion: setFunction,
    crearFormulario: formulario,
    eliminarFuncion: deleteFunction,
    conect : conect,
    getMousePosition:getMousePosition,
    buyTicket: function(col,row){
      buyTicket(col,row);
    },
    getSeats :function(movie, fechaFuncion){
      functionseats (movie,fechaFuncion);
    }
  }
})();