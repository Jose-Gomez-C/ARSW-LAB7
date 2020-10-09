var app = (function () {

    var seats = [[true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true], [true, true, true, true, true, true, true, true, true, true, true, true]];
    var c,ctx,isListen = true;

    class Seat {
        constructor(row, col) {
            this.row = row;
            this.col = col;
        }
    }
    

    var stompClient = null;

    //get the x, y positions of the mouse click relative to the canvas
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
        
  
    };
    
    var drawSeats = function (cinemaFunction) {
        c = document.getElementById("myCanvas");
        ctx = c.getContext("2d");
        ctx.fillStyle = "#001933";
        ctx.fillRect(100, 20, 300, 80);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "40px Arial";
        ctx.fillText("Screen", 180, 70);
        var row = 5;
        var col = 0;
        for (var i = 0; i < seats.length; i++) {
            row++;
            col = 0;
            for (j = 0; j < seats[i].length; j++) {
                if (seats[i][j]) {
                    ctx.fillStyle = "#009900";
                } else {
                    ctx.fillStyle = "#FF0000";
                }
                col++;
                ctx.fillRect(20 * col, 20 * row, 20, 20);
                col++;
            }
            row++;
        }
    };
     
    var connectAndSubscribe = function (callback) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/buyticket', function (message) {
                 callback(message);
            });
        });

    };
    var seatCalculate = function(x,y){
        var row,col,limiteX1;
        var limiteY1;
        var limiteX;
        var limiteY;
        var parar = true; 
        for (var i = 1; i < 8 && parar; i++) {
            for (var j = 1; j < 13 && parar; j++) {
                limiteX = j * 20 +(20*(j-1));
                limiteY = i * 20 + 100 +(20*(i-1));
                limiteX1 = j * 20 *2;
                limiteY1 = i * 20 *2 + 100;
                if (x >= limiteX && x <= limiteX1 && y >= limiteY && y <= limiteY1) {
                    row = i;
                    col = j;
                    console.log(row);
                    console.log(col);
                    parar = false;
                    verifyAvailability(row-1, col-1);
                }
            }
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
    var verifyAvailability = function (row,col) {
        var st = new Seat(row, col);
        if (seats[row][col]===true){
            seats[row][col]=false;
            console.info("purchased ticket");
            stompClient.send("/topic/buyticket", {}, JSON.stringify(st)); 
            
        }
        else{
            console.info("Ticket not available");
        }  

    };
    var getEvent = function(evento){
        var theObject = JSON.parse(evento.body);
        console.info(theObject);
        seats[theObject.row][theObject.col] = false; 
        
        drawSeats();
        alert("Asiento comprado");
    }


    return {
        getMousePosition : getMousePosition,

        init: function () {
            var can = document.getElementById("canvas");
            drawSeats();
            //websocket connection
            connectAndSubscribe(getEvent);
        },

        buyTicket: function (row, col) {
            console.info("buying ticket at row: " + row + " col: " + col);
            verifyAvailability(row,col);
            
            //buy ticket
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();