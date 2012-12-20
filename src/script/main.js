define(function(require, exports, module){

    var cover = require('cover');

    document.getElementById("fire").onclick = function(){

        var source = document.getElementById("source").value;
        var coverageData = cover(source);

        var max= 1,data=[];
        Object.keys(coverageData).forEach(function (key) {
            var c = coverageData[key];
            var count= c.times;
            if(count > max) max = count;

            var point = {y: 6 + (c.node.start.line +1) * 18, x: 54 + (c.node.start.col + 1) * 5, count: count};
            data.push(point);

            //console.log(count, c.node.start, c.node.source());

        });
//        {max: 90, data: [
//            {x: 100, y: 100, count: 80},
//            {x: 120, y: 120, count: 60}
//        ]}

        var pre= document.getElementsByClassName("prettyprint")[0];
        pre.innerText = source;

        prettyPrint();

        // gen heat map
        var heatmap = heatmapFactory.create({"element":document.getElementById("heatmapArea"), "radius":25, "visible":true});
        heatmap.store.setDataSet( {max:max, data:data} );

        console.log( {max:max, data:data} );

    };



});