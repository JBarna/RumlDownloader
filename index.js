"use strict";
var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    stdout = process.stdout,
    baseUrl = 'http://www.cs.unh.edu/~ruml/cs758/',
    assignmentNums = [];


handleArgs();
main();

/* We use recursion with async callbacks so we only download one file at a time */
function main(){
    
    var asst = assignmentNums.shift();
    
    if (asst == null){ stdout.write("All finished"); return; }
    
    stdout.write("\n------------ " + asst + " ---------------\n");
    
    fs.mkdirSync( path.join( __dirname, asst) );
    
    getFilesForAssignment( asst, files => {
       
        stdout.write( files.length + " files.\n");
        
        getFiles();
        
        function getFiles(){
            
            var fileName = files.shift();
            
            if (fileName == null) { main(); return; };
            
            stdout.write("Starting " + fileName + "...");
            
            downloadFile( asst, fileName, () => {
                
                stdout.write("done\n");
                getFiles();
                
            });
            
        }
        
    });
    
}

function downloadFile( assignNum, fileName, cb ){
    
    var fileUrl = baseUrl + assignNum + '/' + fileName,
        filePath = path.join(__dirname, assignNum, fileName);
    
    http.get( fileUrl, res => {

        var ws = fs.createWriteStream(filePath);
        res.pipe(ws);
        ws.on('finish', () => cb());

    });
    
}

function getFilesForAssignment( assignNum, cb ){
    
    
    var assignmentUrl = baseUrl + assignNum + '/';
    
    http.get(assignmentUrl, res => {
        
        var data = "";
        res.setEncoding('utf8');
        
        res.on('data', chunk => data += chunk );
        res.on('end', () => {
            
            var re = /href=\"(.*?)\"/g,
                list = [],
                match;
            
            while( (match = re.exec(data)) != null)
                list.push(match[1]);
            
            list.splice(0, 5);
            cb( list );
            
        });
        
        
    });
}

function handleArgs(){
    
    for (let i = 2; i < process.argv.length; i++){
        
        if (process.argv[i].indexOf('-') > -1){
            
            var parts = process.argv[i].split('-'),
                start = +parts[0], end = +parts[1];
            
            if ( isNaN(start) || isNaN(end)){
                stdout.write("Incorrect command line argument " + process.argv[i] + "\n");
                continue;
            }
            
            for (let n = start; n <= end; n++)
                assignmentNums.push( 'asst-' +  n );
            
        } else {
            
            if ( isNaN(process.argv[i]) ){
                stdout.write("Incorrect command line argument " + process.argv[i] + "\n");
                continue;
            }
            
            assignmentNums.push( 'asst-' + process.argv[i] );    
        }
    }
    
}