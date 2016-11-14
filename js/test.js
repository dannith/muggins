(function(){
var data = {

	render : {
		"players" : [],
		"colors" : ["red","green","yellow","blue"],
		"limit" : 0,
		"appendScore" : 0
	},

	partials : {},

	templates : {},

	clickables : [
	".player", ".num-key", "#append-score", "#config-score", "#score-limit"
	],

	cursor : 0,

	percentages : {},

	view : undefined
};

var octopus = {

	playerHandler : function(div){
		var refresh = false;
		switch($(div).parent().attr("id")){
			case "available":
				this.addPlayer(div.id);
				refresh = true;
				break;
			case "selected":
				this.removePlayer(div.id);
				refresh = true;
				break;
		}
		if (refresh){
			var partial = this.renderPartial("playerToggler");
			$("#player-toggler-refresh").html(partial);
		} else {
			if (data.cursor == 0){
				data.cursor = div.id;
				$(div).addClass("cursor");
				$("#score-keys-toggle").fadeIn("fast");
			} else if (data.cursor == div.id){
				$("#keypad-toggle").slideUp("fast");
				$("#score-keys-toggle").fadeOut("fast");
				$(div).removeClass("cursor");
				data.cursor = 0;
			}
			
		}
	},

	addPlayer : function(color){
		data.render.players.push({"color" : color, "score" : 0});
		for (var i = 0; i < data.render.colors.length; i++){
			if (data.render.colors[i] == color){
				var deleteIndex = i;
			}
		}
		data.render.colors.splice(deleteIndex, 1);
	},

	removePlayer : function(color){		
		data.render.colors.push(color);
		for (var i = 0; i < data.render.players.length; i++){
			if (data.render.players[i].color == color){
				var deleteIndex = i;
			}
		}
		data.render.players.splice(deleteIndex, 1);
	},

	renderPartial : function(partial){
		var template = data.partials[partial];
		var renderer = Handlebars.compile(template);
		var result = renderer(data.render);
		return result;
	},

	renderTemplate : function(view){
		switch(view){
			case "startTemplate":
					var template = Handlebars.compile(data.templates.startTemplate);
					Handlebars.registerPartial("playerToggler", data.partials.playerToggler);
					Handlebars.registerPartial("keypad", data.partials.keypad);
					result = template(data.render);					
				break;
			case "gameTemplate":
					var template = Handlebars.compile(data.templates.gameTemplate);
					Handlebars.registerPartial("playerColumns", data.partials.playerColumns);
					Handlebars.registerPartial("scoreKeys", data.partials.scoreKeys);
					Handlebars.registerPartial("playerSelector", data.partials.playerSelector);
					Handlebars.registerPartial("keypad", data.partials.keypad);
					result = template(data.render);				
				break;
		}
		return result;
	},

	stopSelection : function(){
		$("#keypad-toggle").slideUp("fast");
		$("#score-keys-toggle").fadeOut("fast");
		$("#"+data.cursor).removeClass("cursor");
		data.cursor = 0;
	},

	getPercentages : function(){
			for (i in data.render.players){
				if (data.render.players[i].color == data.cursor){
					var percentage = (data.render.players[i].score / data.render.limit) * 100;
					console.log(percentage);
					percentage = Math.round(percentage);
					console.log(percentage);
					data.percentages[data.cursor] = percentage;					
					view.drawBar(data.cursor);
					if(percentage >= 100){
						this.resetGame();
					}
				}				
			}			
			this.stopSelection();
	},

	resetGame : function(){
		for (i in data.render.players){
			data.render.players[i].score = 0;
		}
		view.draw("startTemplate");
		$("#info").html(data.render.players[i].color +" won!")
	},

	addScore : function(points){
		for(var i = 0; i < data.render.players.length; i++){
			if (data.render.players[i].color == data.cursor){
				data.render.players[i].score += parseInt(points);
			}
		}
		var result = this.renderPartial("playerSelector")
		$("#player-selector-refresh").html(result);
		this.getPercentages();
	}
};

var view = {
	init : function(){
		$.when(
			$.get("partials/addPlayers.handlebars"),
			$.get("partials/keypad.handlebars"),
			$.get("partials/playerColumns.handlebars"),
			$.get("partials/playerSelector.handlebars"),
			$.get("partials/playerToggler.handlebars"),
			$.get("partials/scoreKeys.handlebars"),
			$.get("templates/gameTemplate.handlebars"),
			$.get("templates/startTemplate.handlebars")
			).done(function(p1,p2,p3,p4,p5,p6,t1,t2){
				data.partials.addPlayers = p1[0];
				data.partials.keypad = p2[0];
				data.partials.playerColumns = p3[0];
				data.partials.playerSelector = p4[0];
				data.partials.playerToggler = p5[0];
				data.partials.scoreKeys = p6[0];
				data.templates.gameTemplate = t1[0];
				data.templates.startTemplate = t2[0];
				view.setListener();
				view.draw("startTemplate");
			});
	},

	setListener : function(){
		$("#container").on("click", data.clickables, function(e){
					if ($(e.target).hasClass("num-key")){
						if(data.render.appendScore == 0){
							data.render.appendScore = $(e.target).text();
						} else {
						data.render.appendScore = data.render.appendScore.toString() + $(e.target).text();
					  }
						$("#append-score").text(data.render.appendScore);
					} else if ($(e.target).hasClass("player")){
						octopus.playerHandler(e.target);
					} else if ($(e.target).hasClass("score-key") && $(e.target).text() != "*"){
							octopus.addScore($(e.target).text());		
					} else {
					switch(e.target.id){
						case "config-score":
							data.render.appendScore	= 0;
							$("#append-score").text(data.render.appendScore);
							$("#keypad-toggle").fadeIn("fast");
							break;
						case "confirm-button":
							var lastInt = data.render.appendScore;
							lastInt	= lastInt.toString();
							lastInt = lastInt[lastInt.length - 1];
							if(lastInt == 5 || lastInt == 0){
								if (data.view == "game"){
									octopus.addScore(data.render.appendScore);
								}			
							} else {
								var rounded = 5*(Math.round(data.render.appendScore/5));
								data.render.appendScore = parseInt(rounded);
								if(data.view == "game"){
									$("#append-score").text(rounded);
								}								
							}
							if (data.view == "start"){
								data.render.limit = data.render.appendScore;
								if(data.render.players.length > 0 && data.render.limit > 0){									
									view.draw("gameTemplate");
								} else {
									if (data.render.limit == 0){
										$("#info").html("Please increase the score limit.");
									} else {
										$("#info").html("Please add some players.");
									}
								}
							}
							break;
						case "custom":
							data.render.appendScore = 0;
							$("#append-score").text(data.render.appendScore);
							$("#keypad-toggle").slideDown("fast");
							$("#score-keys-toggle").fadeOut("fast");
							break;
						case "score-limit":
							view.draw("startTemplate");
							break;
					}}
			});
	},

	draw : function(view){
		result = octopus.renderTemplate(view);
		$("#container").html(result);
		$("#keypad-toggle").hide();
		if(view == "gameTemplate"){
			data.view = "game";
			$("#score-keys-toggle").hide();
		} else {
			data.view = "start";
		}
	},

	drawBar : function(color){
		console.log("allpercents"+data.percentages[color]);
		$("#"+color+"-line").find(".status").attr("style", "width: "+data.percentages[color]+"%");
	}

};

view.init();

}());