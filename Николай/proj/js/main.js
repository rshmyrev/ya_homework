var testData = [
{name: "Kolya", age: 32},
{name: "Igor", age: 32},
{name: "Roma", age: 27},
{name: "Vanya", age: 34},
{name: "Max", age: 25},
				];

for (var i = 0; i < testData.length; i++) {
	console.log(testData[i].age)
};

d3.select(".content")
.selectAll(".bar")
.data(testData)
.enter()
.append("div")
.attr('class', 'bar')
.style('height', function(d) {return d.age * 5 + "px";})
.append("div")
.attr('class', 'value')
.text(function(d) {return "Имя\n" + d.name})

//так как наши данные изначально предоставлены в csv то используем в качестве загрузчика функцию d3.csv()
//первым параметром эта функция принимает ссылку на файл с данными
//вторым функцию-обработчик, которая вызывается после завершения загрузки

d3.csv("../../../../data/forestfires.csv", function(data) {
    console.log(data);
    //csv означает что в нашем файле разделителем полей будет запятая, а каждая новая строка это одно событие или объект
    //но всю грязную работу за нас сделает d3
    //в переменной data, d3 разместить нашу таблицу, но уже в подготовленном формате однородный массив с объектами
    //имена полей в объектах берется из первой строки в csv 
    //X,Y,month,day,FFMC,DMC,DC,ISI,temp,RH,wind,rain,area
    //так как d3 не понимает какие поля в таблице являются числоввыми
    //создадим массив и запишем все имена полей с числовыми данными

    var intProperties = [
    "X",
    "Y",
    "FFMC",
    "DMC",
    "DC",
    "ISI",
    "temp",
    "RH",
    "wind",
    "rain",
    "area"
    ];
    //в javascript "5" и 5 это две разные пятерки
    //поэтому результатом  "5" + "5" будет "55"
    //5 + 5 будет равняться 10
    //в javascript как и в других языказ есть базовое приведение типов
    //что жы это ознаяет в базовом понимании, javascript старается понять, что вы хотите сделать
    //предугадывает по определенным правилам типы данных после проведенных манипуляй с ними
    //5 + "5" будет равняться "55"
    //теперь традиционным способом переберем все элементы
    for(var key in data) {
        //в каждом элементе переберем все поля с числовыми значениями и приведем их к типу Number
        //тип Number в js (javascript) представляет как целые числа, так и числа с плавающей точкой
        //для того что бы провести преобразование поставим + перед строкой
        for (var i = 0; i < intProperties.length; i++) {
            data[key][intProperties[i]] = +data[key][intProperties[i]];
        };
    }

	// var graphProperties = [
	// "FFMC",
	// "DMC",
	// "DC",
	// "ISI"
	// ];

 //    for(var key in data) {
 //    	for (var i = 0; i < graphProperties.length; i++) {
 //    		data[key][graphProperties]
 //    	};

    //для того чтобы данные объединить по какому-любо полю посользуемся функцией d3.nest()
    
    var nest = d3.nest()
        //первым делом указываем ключевое поле, по которому пройдет объединение
        .key(function(d) { return d.month; })
        //выберем сортировку данных
        .sortKeys(d3.ascending)
        //укажем данные в которых необходимо провести объединение
        .entries(data);
    console.log(nest);

    //все манипуляции с деревом и данными проводим только после получения данных
    
    //опишем размеры svg для визуализации данных, укажем отступы от границ svg, что бы график не смотрелся и куце
    //и были поля для добавления управляющих элементов
    
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    //выберем наш подготовленный контейнер и добавим в него svg
    var svg = d3.select(".content1").append("svg")
        //зададим в атрибутах svg ширину и высоту
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //добавим в svg новую группу
        //группа не предоставляет возможности рисовать, но может содержить в себе дочерние элементы
        //для нас это просто координатная сетка
      .append("g")
        //сместим всю группу по ранее заданным отступам
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    //d3 забирает всю грязную работу
    //для того что бы преобразовать наши числовые данные к пиксельной сетке svg
    //заведем два конвертора табличных величин в пиксели на экране по одному на каждую ость x и y
    //для начала заведем конвертор для оси X
    //в качестве данных для оси X будем использовать названия месяцев
    //поэтому возьмем d3.scale.ordinal() конвертор
    var x = d3.scale.ordinal()
        //в качестве границ пиксельного диапазона указываем массив из двух значений 0 и ширина svg контейнера
        //вторым параметром мы задаем промежутки между столбцами, что бы получить такую возможность 
        //используется функция .rangeRoundBands() для обычной конвертации без отступов используется .range()
        .rangeRoundBands([0, width], 0.1);
    
    //добавим второй конвертатор для оси Y
    //с ним все проще, линейная зависимость .linear()
    var y = d3.scale.linear()
        //в качестве границ пиксельного диапазона указываем массив из двух значений высота и 0 svg контейнера
        //занчения мы поменяли местами для того что бы инвертировать диапазон и столбцы рисовались снизу вверх
        .range([height, 0]);

    //вторым этапом для объявления связи между нашими данными и пиксельной сеткой в svg
    //для обоих конвертаторов назначим домены
    //домен это второй диапазон полученный из данных
    //для оси X возьмем список с названиями месяцев
    //для того что бы прозрачно получить список с названиями воспользуемся функцией map()
    //заберем все названия месяцев из наших данных
    x.domain(nest.map(function(d) { return d.key; }));
    //для получения линейного диапазона нам нужно знать минимальное и максимальное значение диапазона
    //в качестве минимального условимся, что будем использовать 0
    //в качестве максимального найдем максимальное среди всех индексов FFMC
    y.domain([0, d3.max(data, function(d) { return d.FFMC; })]);
    
    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

	var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

      svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      // .text("Frequency");

      svg.selectAll(".bar1")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar1")
      .attr("x", function(d) { return x(d.month); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.FFMC); })
      .attr("height", function(d) { return height - y(d.FFMC); });

    // задача на дом: построить бары по объедененным данным за 12 месяцев и вывести средний показатель среди всех индексов
    // список индексов: FFMC,DMC,DC,ISI
    // преобразовать домен к среднему по всем 4 индексам
    // вывести бары по аналогии с первым днем, но в svg
    // добавить вертикальный текст к каждому бару со значением среднего индекса и названием месяца
});