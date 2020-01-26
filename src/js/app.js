import * as d3 from "d3"
import { makeTooltip } from './modules/tooltip'

var firstRun = true

function init(results) {

	const container = d3.select("#graphicContainer")
	
	var clone = JSON.parse(JSON.stringify(results));

	console.log(results)

	var data = clone['sheets']['data']
	var settings = clone['sheets']['settings']
	var periods = clone['sheets']['periods']
	var userKey = clone['sheets']['key']
	var tooltip = null;
	var dateParse = null
	var optionalKey = {};
	var xVar;

	if (userKey != undefined) {
		if (userKey.length > 1) { 
		userKey.forEach(function (d) {
			optionalKey[d.keyName] = d.colour; 
		})
		}
	}
	


	function numberFormat(num) {
        if ( num > 0 ) {
            if ( num > 1000000000 ) { return ( num / 1000000000 ) + 'bn' }
            if ( num > 1000000 ) { return ( num / 1000000 ) + 'm' }
            if ( num > 1000 ) { return ( num / 1000 ) + 'k' }
            if (num % 1 != 0) { return num.toFixed(2) }
            else { return num.toLocaleString() }
        }
        if ( num < 0 ) {
            var posNum = num * -1;
            if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 )) + 'bn'];
            if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 )) + 'm'];
            if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 )) + 'k'];
            else { return num.toLocaleString() }
        }
        return num;
    }

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}	

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var height = width*0.3;	
	if (isMobile) {
		height = width * 0.5
	}				
	var margin;
	var dateParse = null
	var parsePeriods = null

	if (settings[0]['margin-top']) {
		console.log("yo")
		margin = {top: +settings[0]['margin-top'], right: +settings[0]['margin-right'], bottom: +settings[0]['margin-bottom'], left:+settings[0]['margin-left']};
	}

	else {
		margin = {top: 20, right: 20, bottom: 20, left:40};	
	}	
	
	console.log(width, height, margin)

	// Check if time format defined by user


	if (typeof settings[0]['dateFormat'] != undefined) {
		dateParse = d3.timeParse(settings[0]['dateFormat']);
	}

	if (typeof settings[0]['periodDateFormat'] != undefined) {
		parsePeriods = d3.timeParse(settings[0]['periodDateFormat']);
	}

	if (settings[0]['xVar']) {
		xVar = settings[0]['xVar'];
	}

	
	if (settings[0].tooltip!='' ) {
		tooltip = true
	}

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

	d3.select("#chartTitle").text(settings[0].title)
    d3.select("#subTitle").text(settings[0].subtitle)
    d3.select("#sourceText").html(settings[0].source)
    d3.select("#footnote").html(settings[0].footnote)
    d3.select("#graphicContainer svg").remove();
    var chartKey = d3.select("#chartKey");
	chartKey.html("");

	var svg = d3.select("#graphicContainer").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");					

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'];

	var categories = [];

	if (settings[0]['categories']) {
		var nest = d3.nest()
			.key(function(d) { return d[settings[0]['categories']]; })
			.entries(data);

		nest.forEach(function(d) {
			categories.push(d.key)
		})
	} 
	console.log(data)

    var color = d3.scaleOrdinal()
	    .domain(categories)
	    .range(colors);

	categories.forEach(function(key,i) { 

	var keyDiv = chartKey.append("div")
						.attr("class","keyDiv")

	keyDiv.append("span")
		.attr("class", "keyCircle")
		.style("background-color", function() {
			if (optionalKey.hasOwnProperty(key)) {
				return optionalKey[key];
			}

			else {
				return color(key);
			}
		})

	keyDiv.append("span")
		.attr("class", "keyText")
		.text(key)

	})
	if (dateParse != null) {
		data.forEach(function(d) {
						d[xVar] = dateParse(d[xVar])
		})
	}

	if (parsePeriods != null) {
		periods.forEach(function(d) {
			if (typeof d.start == 'string') {
				d.start = parsePeriods(d.start);
				d.end = parsePeriods(d.end);
				d.middle = new Date( (d.start.getTime() + d.end.getTime())/2);
			}	
		})
	}
	var x = d3.scaleTime()
		.rangeRound([0, width]);

	x.domain(d3.extent(data, function(d) { return d[xVar]; }));


	features.selectAll(".periodLine")
		.data(periods)
		.enter().append("line")
		.attr("x1", function(d,i) { 
			return x(d.start)
		})
		.attr("y1", 0)     
		.attr("x2", function(d,i) { 
			return x(d.start)
		})  
		.attr("y2", height)
		.attr("class","periodLine mobHide")
		.attr("stroke", "#bdbdbd")
		.attr("opacity",function(d) {
			if (d.start < x.domain()[0]) {
				return 0	
			}

			else {
				return 1
			}
			
		})
		.attr("stroke-width", 1);

	features.selectAll(".periodLine")
			.data(periods)
			.enter().append("line")
			.attr("x1", function(d,i) { 
				return x(d.end)
			})
			.attr("y1", 0)     
			.attr("x2", function(d,i) { 
				return x(d.end)
			})  
			.attr("y2", height)
			.attr("class","periodLine mobHide")
			.attr("stroke", "#bdbdbd")
			.attr("opacity",function(d) {
			if (d.end > x.domain()[1]) {
				return 0	
			}

			else {
				return 1
			}
			
		})
			.attr("stroke-width", 1);	

	features.selectAll(".periodLabel")
		.data(periods)
		.enter().append("text")
		.attr("x", function(d) { 
			if (d.labelAlign == 'middle')
			{
				return x(d.middle)	
			}

			else if (d.labelAlign == 'start') {
				return x(d.start) + 5	
			}
			
		})
		.attr("y", -5)
		.attr("text-anchor", function(d) {  
			return d.labelAlign
		
		})
		.attr("class", "periodLabel mobHide")
		.attr("opacity",1)
		.text(function(d) { return d.label});


	var simulation = d3.forceSimulation(data)
      .force("x", d3.forceX(function(d) { return x(d[xVar]); }).strength(1))
      .force("y", d3.forceY(height / 2))
      .force("collide", d3.forceCollide(5))
      .stop();

  	for (var i = 0; i < 120; ++i) simulation.tick();

	features.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + height + ")")
	      .call(d3.axisBottom(x));

	  var cell = features.append("g")
	      .attr("class", "cells")
	    .selectAll("g").data(d3.voronoi()
	        .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.top]])
	        .x(function(d) { return d.x; })
	        .y(function(d) { return d.y; })
	      .polygons(data)).enter().append("g").attr("class","cell");

	  cell.append("circle")
	      .attr("r", 4)
	      .attr("fill", function(d) { 

	      	if (settings[0]['categories']) {
	      		return color(d.data[settings[0]['categories']])
	      	}

	      	else {
	      		return "#00000"
	      	}

	      })
	      .attr("cx", function(d) { return d.data.x; })
	      .attr("cy", function(d) { return d.data.y; })
	      .attr("class", "circles")

	  cell.append("path")
	      .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

	  // cell.append("title")
	  //     .text(function(d) { return d.data.name });


	if (tooltip) {
		makeTooltip(".cell");	
	}	      

	firstRun = false;
};	


function getURLParams(paramName) {

	const params = window.location.search.substring(1).split("&")

    for (let i = 0; i < params.length; i++) {
    	let val = params[i].split("=");
	    if (val[0] == paramName) {
	        return val[1];
	    }
	}
	return null;

}

const key = getURLParams('key') //"10k7rSn5Y4x0V8RNyQ7oGDfhLvDqhUQ2frtZkDMoB1Xk"

if ( key != null ) {

	Promise.all([
		d3.json(`https://interactive.guim.co.uk/docsdata/${key}.json`)
		])
		.then((results) =>  {
			init(results[0])
			var to=null
			var lastWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
			window.addEventListener('resize', function() {
				var thisWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
				if (lastWidth != thisWidth) {
					window.clearTimeout(to);
					to = window.setTimeout(function() {
						    init(results[0])
						}, 100)
				}
			
			})

		});

}