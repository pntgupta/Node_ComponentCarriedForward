var express = require('express'),
	app = express(),
	server = app.listen(8000,function(){console.log("Listening to port 8000...");}),
	io = require('socket.io')(server),
	fs = require('graceful-fs'),
	parseString = require('xml2js').parseString;;


app.get("/",function(req,res){
	res.sendFile(__dirname+'/index.html');
});

io.on('connection',function(client){

	client.on("search",function(taskRepoPath){

		var absPath = taskRepoPath.replace("TaskRepository.xml",""),
			XMLFoundArray = [], XMLFound = 0;

		fs.readFile(taskRepoPath,"utf-8",function(err,taskRepo){
			parseString(taskRepo, function (err, result) {
				if(err)
					console.log("Invalid Task Repo");
				else{
					result.tasks.task.forEach(function(obj){
						if((obj.$.appID=="28" || obj.$.appID=="29" || obj.$.appID=="26" || obj.$.appID=="27") && obj.$.id.substr(0,3)!="AIO" && obj.$.id.substr(0,4)!="PH16"){
							XMLFound++;
							XMLFoundArray.push({"XMLPath":absPath+obj.$.xmlPath,"TaskID":obj.$.id,"AppID":obj.$.appID});
						}
					});

					XMLFoundArray.sort(function(a,b){
						if(a.TaskID > b.TaskID)
							return 1;
						else
							return -1;
					});


					XMLFoundArray.forEach(function(value,index){
						if(XMLFoundArray[index+2] && XMLFoundArray[index+2].AppID === value.AppID){
							var TaskID1 = value.TaskID.split(".");
								TaskID2 = XMLFoundArray[index+2].TaskID.split(".");
							if(parseInt(TaskID1[4])+1 == TaskID2[4])
								ReadXML(client,value,XMLFoundArray[index+2]);
						}						
					});

					client.emit("Finished",XMLFound);
	 				console.log("\nFinished Searching.\nTotal XMLs found : "+XMLFound);			
				}
			});
		});
	});
});


function ReadXML(client,currentTask,nextTask){
	//In task Repo spaces are present in some tasks
	currentTask.XMLPath = currentTask.XMLPath.replace(" ","");

	fs.readFile(currentTask.XMLPath,"utf-8",function(err,xmlContent){
		if(err)
			console.log("Error reading XML : "+currentTask.taskID);
		else{
			//Reading next consecutive XML
			fs.readFile(nextTask.XMLPath,"utf-8",function(err,nextTask_xmlContent){
			if(err)
				console.log("Error reading XML : "+nextTask.taskID);
			else
				client.emit('XMLContent',{xmlContent,nextTask_xmlContent,currentTask,nextTask});
			});
		}
	});
}