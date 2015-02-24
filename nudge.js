#!/usr/bin/env node

"use strict";

var http = require("http"),
    querystring = require("querystring"),
    child_process = require("child_process");

function writeCSS(res) {
    res.writeHead(200, {
        "Content-Type": "text/css"
    });

    res.write("/* style.css - this space intentionally left blank */");
    res.end();
}

function beginPage(res, title) {
    res.write("<!DOCTYPE html>\n");
    res.write("<html lang='en'>\n");
    res.write("<head>\n");
    res.write("<meta charset='utf-8'>\n");
    res.write("<title>"+ title + "</title>\n");
    res.write("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css'>\n");
    res.write("<link rel='stylesheet' href='style.css'>\n");
    res.write("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap-theme.min.css'>\n");
    res.write("</head>\n");
    res.write("<body>\n");
    // res.write("<header style='padding:20px;'>\n");
	res.write("<nav class='navbar navbar-inverse navbar-fixed-top'>\n");
	res.write("<div class='container'>\n");
	res.write("<div class='navbar-header'>\n");
	res.write("<a class='navbar-brand' href='#'>Nudge</a>\n");
	res.write("</div>\n");
	res.write("</div>\n");
	res.write("</nav>\n");
	res.write("<div class='jumbotron' style='border-bottom:0px;margin-bottom:0px; padding-bottom:0px;'>\n");
	
}

function endPage(res) {
	res.write("<script src='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js'></script>\n");
	res.write("<script src='https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js'></script>");
    res.write("</body>\n");
    res.write("</html>\n");
    res.end();
}

function writeHeading(res, tag, title,tagClass1,tagClass2) {
    res.write(tagClass1+"<" + tag + ">" + title + "</" + tag + ">"+tagClass2+"\n");  
    res.write("</div>\n");
    // res.write("</header>\n");
}

function writePre(res, divClass, data) {
    var escaped = data.replace(/</, "&lt;").
                       replace(/>/, "&gt;");
	// res.write("<div class='jumbotron'>\n");
    res.write("<div class='container' style='padding-bottom:30px;padding-top:30px'>\n");
    res.write("<div class='" + divClass + "_div'>\n");
    res.write("<pre>");
    res.write(escaped);
    res.write("</pre>\n");
    res.write("</div>\n");
    // res.write("</div>\n");	
    res.write("</div>\n");

}

function beginForm(res) {
	res.write("<div class='container'>\n");
    res.write("<form method='POST' action='/push'>\n");
}   

function endForm(res) {
	res.write("<p>");
    res.write("<input type='submit' class='btn btn-default' value='Push'>\n");
    res.write("</p>");
    res.write("</form>\n");
    res.write("</div>\n");

}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function beginSelect(res, what) {
    res.write("<div class='" + what + "_div'>\n");
    res.write("<div class='row'>\n");
    res.write("<div class='col-xs-1'>\n");
    res.write("<label for='" + what + "_select'>" + capitalize(what) + "</label>\n");
    res.write("</div>\n");
    res.write("<div class='col-xs-3'>\n");
    res.write("<select id='" + what + "_select' class='form-control input-lg' name='" + what + "'>\n");
}

function writeOption(res, option) {
    res.write("<option value='" + option + "'>" + option + "</option>\n");
}

function endSelect(res) {
    res.write("</select>\n");
    res.write("</div>\n");
    res.write("</div>\n");
    res.write("</div>\n");
}

function gitRemote(res) {
    child_process.exec("git remote", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing remotes","","");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                remotes = output.split(/\n/);

            beginSelect(res, "remote");

            remotes.forEach(function(remoteName) {
                if (remoteName) {
                    writeOption(res, remoteName);
                }
            });

            endSelect(res);
            endForm(res);
            endPage(res);
        }
    });
}

function gitBranch(res) {
    child_process.exec("git branch", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing branches","","");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                branches = output.split(/\n/);

            beginForm(res);
            beginSelect(res, "branch");

            branches.forEach(function(branch) {
                var branchName = branch.replace(/^\s*\*?\s*/, "").
                                        replace(/\s*$/, "");

                if (branchName) {
                    writeOption(res, branchName);
                }
            });

            endSelect(res);
            gitRemote(res);
        }
    });
}

function gitStatus(res) {
    child_process.exec("git status", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error retrieving status","","");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
        	var tagClass1 ="";
        	var tagClass2 = "</div>";
        	tagClass2 += "</div>";
            writeHeading(res, "h2", "Git Status",tagClass1,tagClass2);
            writePre(res, "container", stdout);
            gitBranch(res);
        }
    });
}

function gitPush(req, res) {
    var body = "";

    req.on("data", function(chunk) {
        body += chunk;
    });

    req.on("end", function () {
        var form = querystring.parse(body);

        child_process.exec("git push " + form.remote + " " + form.branch, function(err, stdout, stderr) {
            if (err) {
            	var tagClass1 ="<div class='container'>";
        		var tagClass2 = "</div>";
                writeHeading(res, "h2", "Error pushing repository",tagClass1,tagClass2);
                writePre(res, "error", stderr);
            } else {
            	var tagClass1 ="<div class='container'>";
        		var tagClass2 = "</div>";
                writeHeading(res, "h2", "Git Push",tagClass1,tagClass2);
                writePre(res, "push", stdout);
            }
            gitStatus(res);
        });
    });
}

function frontPage(req, res) {
    res.writeHead(200, {
        "Content-Type": "text/html"
    });

    if (req.url === "/style.css") {
        writeCSS(res);
    } else {
        var title = "Nudge - Web Interface for Git Push";
        var tagClass1 ="<div class='container'>";
        tagClass1+="<div class='page-header'>";
        var tagClass2 = "";
        tagClass2 += "";
        

        beginPage(res, title);
        writeHeading(res, "h1", title,tagClass1,tagClass2);

        if (req.method === "POST" && req.url === "/push") {
            gitPush(req, res);
        } else {
            gitStatus(res);
        }
    }
}

var server = http.createServer(frontPage);
server.listen();
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
