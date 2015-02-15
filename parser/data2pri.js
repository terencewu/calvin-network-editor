
var fs = require('fs');
var sprintf = require("sprintf");

function expand() {
    var editorFs = require('/home/twu/Documents/calvin-network-editor/app/js/fs.js').fs;
    var fs = require('fs');

    if( process.argv.length < 4 ) {
		console.log('invalid args: [repo dir] [prmname]');
		return;
    }

    var prmname = process.argv[3];
    var dir = process.argv[2];

    var geojson = null;
    if( fs.existsSync(dir+'/data/nodes/'+prmname+'/node.geojson') ) {
		geojson = JSON.parse(fs.readFileSync(dir+'/data/nodes/'+prmname+'/node.geojson'));
		geojson.properties._file = dir+'/data/nodes/'+prmname+'/node.geojson';

    } else if ( fs.existsSync(dir+'/data/links/'+prmname+'/link.geojson') ) {
		geojson = JSON.parse(fs.readFileSync(dir+'/data/nodes/'+prmname+'/node.geojson'));
		geojson.properties._file = dir+'/data/links/'+prmname+'/link.geojson';

    }

    if( !geojson ) {
		console.log('invalid prmname: '+prmname);
		return;
    }

    editorFs.loadRefs(geojson, function(){
		delete geojson.properties._file;
		console.log(JSON.stringify(geojson, '', '  '));
		
    });

}

function printdir() {
    //Focus on Nodes first then links
    //console.log(fs.readdirSync(dir+'/data/links/'))
    var dir = process.argv[2];


	function node_definitions() {
		//will need to check for directory existence
		
		var nodes_path = dir+'/data/nodes/';
		var nodes_list = fs.readdirSync(nodes_path);

		console.log("..        ***** NODE DEFINITIONS *****")
		console.log("..         ")
		for(var i = 0; i < nodes_list.length; i++) {
			var geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				var geojson = JSON.parse(fs.readFileSync(geojsonfile));
				//			console.log(JSON.stringify(geojson, '', '  '));
				console.log("NODE     " + geojson["properties"]["prmname"])
				console.log("ND       " + geojson["properties"]["description"])
				console.log("..       ")
			}
		}
	}
	/**
	   The inflow of a node is found in the /data/nodes/nameofnode
	   for example: node C116 has inflow LV-HAIWEE in a csv file in same
	   directory
	   REMEMBER, there may be more than one inflow??
	 **/
	function inflow_definitions() {
		console.log("..         ")
		console.log("..         ")
		console.log("..         ")
		console.log("LINK      DIVR      SOURCE    SINK      1.000     0.00")
		console.log("LD        Continuity Link")
		console.log("..         ")
		console.log("..        ***** INFLOW DEFINITIIONS *****")
		console.log("..         ")

		var nodes_path = dir+'/data/nodes/';
		var nodes_list = fs.readdirSync(nodes_path);
		//console.log(nodes_list)
		for(var i = 0; i < nodes_list.length; i++) {
			console.log("\n" + nodes_list[i] + "\n");
			geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				geojson = JSON.parse(fs.readFileSync(geojsonfile));
				if( geojson["properties"]["inflows"] ) {
					
					//console.log(JSON.stringify(geojson, '', '  '));
					console.log("LINK      INFL      SOURCE    " + geojson["properties"]["prmname"] + "   1.000     0.00")

					csvfile = nodes_path + nodes_list[i]+ "/" + geojson["properties"]["inflows"][0]["$ref"];
					var partF = "";
					var LD = ""
					//console.log(csvfile);
					if( fs.existsSync(csvfile)){
						var content = fs.readFileSync(csvfile);
						var firstline = String(content).split("\n")[0];

					    var regex = /[A-Z0-9 _-]+/
						var temp = firstline.split(",")[1];
						LD = temp;
						//console.log(matchedstuff[0]);
						//console.log(content.indexOf('\n'));
						//part F needs more information to do this
						partF = temp.toUpperCase();
					}


					console.log("LD        " + LD);
					console.log("IN        A="+""+" B=SOURCE_"+geojson["properties"]["prmname"]+ " C="+"FLOW_LOC(KAF)"+" E="+"1MON"+" F=" + partF);
					console.log("..        ");

					/*
					  Page 63 in the manual

					  And some other page describing IN
					  A random text that user put in
					  B source name : SOURCE_NAMEOFSOURCE
					  C FLOW_LOC is cubic feet/second  FLOW_LOC(KAF) is kilo acre foot

					  E time so 1MON = 1 month
					  F An abbreviation of some sort for the LD essentially 
					*/
				}
			}
		}
	}
	function storagelink_definitions() {
		var nodes_path = dir+'/data/nodes/';
		var nodes_list = fs.readdirSync(nodes_path);

		console.log("..        ***** STORAGE LINK DEFINITIIONS *****");
		console.log("..        ");

		for(var i = 0; i < nodes_list.length; i++) {
			//console.log("\n" + nodes_list[i] + "\n");
			var geojsonfile = nodes_path + nodes_list[i] +'/node.geojson';
			if( fs.existsSync(geojsonfile) ) {
				var geojson = JSON.parse(fs.readFileSync(geojsonfile));


				//has an upper bound limit
				if( geojson["properties"]["type"] == "Surface Storage" ||
					geojson["properties"]["type"] == "Groundwater Storage") {

					//console.log(geojson["properties"]["prmname"]);
					var name = geojson["properties"]["prmname"];
					var lowerbound = "";
					var upperbound = "";
					if(geojson["properties"]["constraints"]["lower"]["bound_type"] == "Constant") {
						lowerbound = geojson["properties"]["constraints"]["lower"]["bound"];
					}
					if(geojson["properties"]["constraints"]["upper"]["bound_type"] == "Constant") {
						upperbound = geojson["properties"]["constraints"]["upper"]["bound"];
					}					
					
					console.log("LINK      RSTO      " + name  + "      " + name  + "      1.000      " + lowerbound + "     " + upperbound);
				    //other way of setting up LD
				    //console.log("LD        " + name + " = " + + " Storage Link") 
					var LDname = geojson["properties"]["description"];
					console.log(sprintf("%-9s %s","LD",LDname + " Storage Link"));
					
					//checks for BU
					if(geojson["properties"]["constraints"]["upper"]["$ref"]) {
						var boundcsv = geojson["properties"]["constraints"]["upper"]["$ref"]
						
						var csvfile = nodes_path + nodes_list[i]+ "/" + geojson["properties"]["constraints"]["upper"]["$ref"];

						if( fs.existsSync(csvfile)){
							var content = fs.readFileSync(csvfile);
							var lines = String(content).split("\n");
							var bound_type = lines[0].split(",");
							var bound_found = false;
							var BU = "";
							var bound_type = bound_type[1];
							for(var ii = 1; ii < lines.length; ii++) {
								if(bound_found) {
									BU = BU + lines[ii];
								}
								else if(lines[ii] == "bound,"){
									bound_found = true;
								}
							}
							//remove the last comma?
						}
						if(BU != "") {
							console.log("BU        " + BU);
						}

						//NOTES: every BU has an EV (Evaportion Rate) in storage link
						console.log(sprintf("%-9s A=%s B=%s C=-s E=%s F=%s","EV", name, "EVAP_RATE(FT)", "1MON", LDname));
					}//if for BU
					//PS
					if(geojson["properties"]["costs"]["type"] == "Constant") {
						console.log(sprintf("%-9s MO=%s A=%s B=%s C=%s D=%s E=%s F=%s","PS","ALL","UCD ____", "DUMMY", "BLANK","","",""));
					}
					else if(geojson["properties"]["costs"]["type"] == "Monthly Variable") {
						var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
						for(var month = 0; month < 12; month++) {
							//figuring out why C=Q(K$-KAF)-P vs C=STOR(K$-KAF)-P
							//above described in pg. 84 in manual
							console.log(sprintf("%-9s MO=%s A=%s B=%s C=%s D=%s E=%s F=%s","PS",months[month],"UCD ____", name, "BLANK","",months[month],""));
						}
					}

					//QI
					console.log("QI        " + "A=" + "" + " B=" + name + " C=" + "" + " D=" + "" + " E=" + "1MON" + " F=" + "" );

					console.log("..        ");
				}//check for storage type

			}

		} //end for loop

	}
	//node_definitions();
	//inflow_definitions();
	storagelink_definitions();
}

printdir();
