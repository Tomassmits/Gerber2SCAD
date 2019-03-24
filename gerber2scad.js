const args = process.argv;

const IDX_G01_X = 2;
const IDX_G01_Y = 3;
const IDX_G01_D = 4;

if( args.length <=2 ) {
    console.log("Please provide filename");
    process.exit(1);
}

gerberFilename = args[2];

console.log("Reading: " + gerberFilename);

var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(gerberFilename)
});

boardOutline=[];
var addBoardOutlinePoint = (x, y, d) => {
    boardOutline.push(
        {
            "x": x,
            "y": y,
            "d": d
        } 
    )
}

/**
 * Convert polygon (provided as simple array of {x:x, y:y}) to a polyhedron with points and faces.
 */
var polygon2polyhedron = ( outline ) => {
    let polyhedron = { points:[], faces:[] }

    let faces = []  // All faces combined into one array

    let bottomFace = []
    let topFace = []

    let prevI = 0
    let i = 0

    outline.forEach( o => {
        polyhedron.points[i]   = [o.x, o.y, 0]
        polyhedron.points[i+1] = [o.x, o.y, 1]
        if( o.d === "01" ) {   // Draw line
            faces.push( [prevI, i, i+1, prevI+1] )
            bottomFace.push(i)
            topFace.push(i+1)
        }
        if( o.d === "02" ) {   // Move head (w/o drawnig)
            faces = faces.concat([bottomFace]).concat([topFace])    // Store bottomFace and topFace
            bottomFace = []
            topFace = []
        }
        prevI = i
        i+=2
    })

    polyhedron.faces = faces.concat([bottomFace]).concat([topFace])    // Store bottomFace and topFace

/*
    //////////////////
    let topFace = []
    let bottomFace = []
    let sideFaces = []
    let topPoints = []
    let bottomPoints = []
    let polyhedron = { points:[], faces:[] }
    let i = 0
    outline.forEach(e => {
        topPoints.push(
            [e.x,e.y,0]
        )
        topFace.push(i)
        i++
    })
    outline.forEach(e => {
        bottomPoints.push(
            [e.x,e.y,1]
        )
        bottomFace.push(i)
        i++
    })

    i = 0;
    outline.forEach(e => {
        sideFaces.push( [
            i,i+1,i+outline.length+1,i+outline.length
        ])
        i++
    })

    polyhedron.points = topPoints
    polyhedron.points = polyhedron.points.concat(bottomPoints)

    //topFace.pop();
    //bottomFace.pop();
    polyhedron.faces.push(topFace)
    polyhedron.faces.push(bottomFace)
    polyhedron.faces = polyhedron.faces.concat(sideFaces)
*/

    return polyhedron;
    //console.log("polyhedron")
    //console.log(polyhedron)
}

var polyhedron2scad = (polyhedron) => {
    ret = "polyhedron(\n"
    ret += "    points =" + JSON.stringify(polyhedron.points) + ",\n"
    ret += "    faces =" + JSON.stringify(polyhedron.faces) + "\n"
    ret += ");"
    /*
    polyhedron.points.forEach(p => {
        ret += "["+p.x+","+p.y+",0],\n"
    })
    polyhedron.faces.forEach(f => {
        ret += "["+f.x+","+y+",0],\n"
    })*/

    return ret
}

var writeFile = (filename, content) => {
    const fs = require('fs');
    fs.writeFile(filename, content, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved as " + filename);
    }); 
}

lineReader.on('line', function (line) {
    if( line.startsWith("G01") ){
        console.log(line);
        let match = line.match(/G(\d+)X(-*\d+)Y(-*\d+)D(\d+)*/)
        if( match !== null ) {
            if( match[IDX_G01_D] === "01" || match[IDX_G01_D] === "02" ) {
                addBoardOutlinePoint(match[IDX_G01_X]/1000, match[IDX_G01_Y]/1000, match[IDX_G01_D]);
            }
        }
    }
    if( line.startsWith("M") ){
        console.log(line);
        let match = line.match(/M(\d+)*/)
        console.log(match);
        if( match[1] === '00' ) {
            let polyhedron = polygon2polyhedron(boardOutline);
            writeFile("out.scad", polyhedron2scad(polyhedron))
        }
        //console.log(match);
        //if( match[IDX_G01_D] === "01" || match[IDX_G01_D] === "02" ) addBoardOutlinePoint(match[IDX_G01_X], match[IDX_G01_Y]);

    }
    

});



