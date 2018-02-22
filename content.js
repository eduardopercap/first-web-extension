
var loc = document.location.href; //Obtengo la URL de la pagina de grupos de Hypothesis. Ejemplo: "https://hypothes.is/groups/YjymyPqK/iaehu2018"
var urlSplit = loc.split('/'); //Divido la URL tomando como divisor "/" y guardo sus valores en un array. Ejemplo: ["https:", "", "hypothes.is", "groups", "YjymyPqK", "iaehu2018"]
urlSplit.pop(); //Elimino el ultimo elemento
var group = urlSplit.pop(); //Elimino de nuevo el ultimo elemento obteniendo el penultimo elemento de la URL que hace referncia al grupo. Ejemplo:"YjymyPqK"
obtenerAnotaciones(group);

/* Obtiene las anotaciones de un grupo y dibuja el grafico*/
function obtenerAnotaciones(group) {
    var xhttp = new XMLHttpRequest(); //AJAX
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var anotaciones = JSON.parse(this.responseText); //Convierte el resultado en un objeto Javascript
            var fechasSinFormato=_.pluck(anotaciones.rows,'created'); //Filtramos para obtener unicamente las fechas de cada anotacion
            var fechasConFormato=_.map(fechasSinFormato, obtenerFecha); //Aplicamos la funcion obtenerFecha para cambiar el formato de las fechas obtenidas
            var fechasOrdenadas=_.sortBy(fechasConFormato); //Ordenamos las fechas
            var fechasAgrupadas=_.countBy(fechasOrdenadas); //Agrupamos las fechas para obtener las anotaciones. Ejemplo: {"04/01/2018":3,"09/01/2018":1}
            var fechas=Object.keys(fechasAgrupadas); //Guardamos en una lista las fechas
            var numAnotaciones=Object.values(fechasAgrupadas); //Guardamos en una lista el numero de anotaciones
            dibujarGrafico(fechas,numAnotaciones); //Dibujamos el grafico


        }
    };
    xhttp.open("GET", "https://hypothes.is/api/search?group="+group, true); //Solicitud para obtener las anotaciones del grupo
    xhttp.setRequestHeader("Authorization", "Bearer 6879-Q--ve1yLCItODnHueg4py6UT-qqq93bk-xgvra0-BVA"); //API Token para poder obtener las anotaciones de un grupo (solo funciona si se pertenece a dicho grupo)
    xhttp.send();
}

/* Dada una fecha la devuelve en formato dd-mm-yyyy */
function obtenerFecha(f) {
    var date = new Date(f);
    var day = date.getDate();
    var month = date.getMonth()+1; //getMonth devuelve de 0 a 11
    var year=date.getFullYear();
    if(day<10){ day='0'+day;}
    if(month<10){ month='0'+month;}
    fecha=day+'/'+month+'/'+year;
    return fecha;
}

function dibujarGrafico(fechas,numAnotaciones){
    var svgwidth = 500;
    var svgheight =400;
    var barheight =350; //Altura maxima de las barras
    var graphicWidth=450; //Anchura del grafico
    var barPadding = 5; //Espacio entre las barras
    var leftMargin=30; //Margen izquierdo
    var bottomMargin=20; //Margen inferior
    var max = d3.max(numAnotaciones); //Numero maximo de anotaciones realizado en un dia
    var xScale = d3.scale.ordinal() //Escala del eje x
        .rangeRoundBands([0, graphicWidth]) //El rango de salida de la escala es el rango de valores posibles de salida
        .domain(fechas.map(function(d) { return d; })); //El dominio de entrada de una escala es el rango de los valores iniciales
    var yScale = d3.scale.linear() //Escala del eje yAxis
        .range([barheight, 0]) //Si pusieramos ([0, barheight] saldria el eje al reves
        .domain([0, max]);
    var y = d3.scale.linear() //Escala que usaremos para obtener la altura de las barras
        .range([0, barheight])
        .domain([0, max]);
    var yAxis = d3.svg.axis() //Creacion del eje Y
        .scale(yScale) //Escala que va a usar el eje
        .orient("left") //Los valores saldran a la izquierda del eje
        .tickFormat(d3.format("d")) //Evitar que salgan decimales en el eje Y
    ;
    var xAxis = d3.svg.axis() //Creacion del eje X
        .scale(xScale) //Escala que va a usar el eje
        .orient("bottom") //Los valores saldran por debajo del eje
    ;

    //Creacion del SVG para "dibujar"
    var svg = d3.select(".search-results__total") //Seleccionamos el div
        //.append("br")
        .append("svg") //Insertamos el elemento
        .attr('height', svgheight)
        .attr('width', svgwidth);

    //Creacion del tooltip (un cuadro con el valor de la barra)
    var tooltip = d3.tip() //Creacion del tooltip
        .attr('class', 'd3tip')
        .offset([-10, 0])
        .html(function(d) {
            return "Annot. number: <br><strong>" + d+"</strong>"; //Mensaje del tooltip
        });

    svg.call(tooltip);

    //Creacion de las barras
    svg.selectAll('rect') //Seleccionamos todos los elementos rect. Como aún no existen, el programa devuelve una selección vacía (Con D3 siempre es necesario seleccionar primero aquello sobre lo que va a aplicar una accion, aun cuando esa selección este vacía por el momento.)
        .data(numAnotaciones) //Introducimos los datos
        .enter() //Devuelve la posicion a una seleccion por cada dato que hasta el momento no tiene un rect correspondiente, es decir, todos.
        .append('rect') //Añade la barra
        .attr('width', (graphicWidth)/fechas.length -barPadding) //Establecemos la anchura de las barras
        .attr('x', function(d,i){return leftMargin + i*graphicWidth/fechas.length;}) //Posicion x de cada barra. Estos calculos son para que no haya desbordamientos (que se mantenga en los margenes establecidos). Multiplicamos por el indice porque si no salen todas las barras superpuestas
        .attr('y', function(d){return svgheight - y(d)-bottomMargin;}) //Posicion y de donde comienzas las barras. El problema principal es que SVG pinta desde la esquina superior izquierda hacia abajo por lo que hacemos la resta para que pinte hacia arriba
        .attr('height', function(d){return y(d);}) //Altura de la barra
        .attr("fill", function(d) { //Pintamos las barras en distintas tonalidades de un color segun su valor.
            return "rgb(0, 0, " + (d * 30) + ")";
        })
        .on('mouseover', tooltip.show) //Al pasar por encima de una barra aparece el tooltip
        .on('mouseout', tooltip.hide); //Al dejar de estar encima de la barra desaparece el tooltip

    //Añadiendo ejes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+leftMargin+"," + (svgheight- bottomMargin) + ")") //Posicion del eje X
        .call(xAxis)  //Añadimos el eje X
        .append("text") //Añadimos texto en el eje X
                .attr("y",10)
                .attr("dy", ".7em")
                .style("text-anchor", "middle")
                .text("Dates");

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + leftMargin + ","+(svgheight-barheight - bottomMargin)+")") //Posicion del eje Y
        .call(yAxis)
        .append("text") //Añadimos texto en el eje Y
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Annotations");
}
