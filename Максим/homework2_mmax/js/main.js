d3.csv("data/forestfires.csv", function(data) {
	
	//переводим числовые данные в числовой формат
	var intProperties = ["X","Y","FFMC","DMC","DC","ISI","temp","RH","wind","rain","area"]
	for (var key in data) {
		for (var i = 0; i < intProperties.length; i ++) {
			data[key][intProperties[i]] = +data[key][intProperties[i]];
		};
	};

	//группируем данные по месяцам
	var nest = d3.nest()
		.key(function(d) { return d.month; })
		.sortKeys(d3.ascending)
		.entries(data);

	//добавляем для каждого месяца среднее значение
	for (var i = 0; i < nest.length; i++) {
		nest[i].avgIndex = 0
		for (var j = 0; j < nest[i].values.length; j++) {
			nest[i].avgIndex += (nest[i].values[j].FFMC+nest[i].values[j].DMC+nest[i].values[j].DC+nest[i].values[j].ISI) / 4
		}
		nest[i].avgIndex = nest[i].avgIndex / nest[i].values.length
	}

	//описываем размер svg
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 960 - margin.left - margin.right;
			//вопрос: (1) насколько удобно прописывать 960 и 500 прямо в переменных?
			// (2) они нам больше нигде не пригодятся? не нужно их выделить отдельной переменной?
			// (3) расскажешь про размеры? как определить размер для своей картинки: 960х500 или какой-то другой?
		height = 500 - margin.top - margin.bottom;

	//добавляем svg
	var svg = d3.select(".content").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//заведём конвертеры величин для осей
	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], 0.1);
	var y = d3.scale.linear()
		.range([height, 0]);

	//назначем домены — второй диапазон, полученный из данных (?)
	x.domain(nest.map(function(d) { return d.key; }));
	y.domain([0, d3.max(nest, function(d) { return d.avgIndex; })]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		//.ticks(10, "%"); - не понял, как это работает, но в нашем случае это не нужно

	//добавляем оси
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
		.attr("dy", ".71em") //"y" сдвигает подпись, чтобы она не перекрывала ось. а для чего "dy"?
		.style("text-anchor", "end")
		.text("Average Index (FFMC, DMC, DC, ISI");

	svg.selectAll(".bar")
		.data(nest)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return x(d.key); })
		.attr("width", x.rangeBand()) //непонятно, что такое rangeBand
		.attr("y", function(d) { return y(d.avgIndex); })
		.attr("height", function (d) { return height - y(d.avgIndex); });	

	svg.selectAll(".label")
		.data(nest)
		.enter().append("text")
		.attr("class", "label")
		.attr("x", function(d) { return x(d.key) + 10; }) //(проблема) положение подписей подгоняется руками
		.attr("y", function(d) { return y(d.avgIndex) +d.avgIndex; }) //(проблема) положение подписей подгоняется руками
		.text(function(d) { return d.key + ": " + d.avgIndex.toFixed(2); });

});