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
	".player", ".num-key", "#append-score", "#config-score", "#score-limit" // Fyrir listener.
	],

	cursor : 0,

	percentages : {},

	view : undefined
};

var octopus = {

	playerHandler : function(div){ //When player is clicked -enter switch statement when adding or removing players if selecting player sin game menu - set cursor
		var refresh = false;
		switch($(div).parent().attr("id")){
			case "available":
				this.addPlayer(div.id);
				refresh = true;
				break;
			case "selected":
				this.removePlayer(div.id);
				refresh = true;
		}
		if (refresh){ // Refresh the player add / remove view
			var partial = this.renderPartial("playerToggler");
			$("#player-toggler-refresh").html(partial);
		} else { // Will always refresh if in start view, this will fire in game view.
			if (data.cursor == 0){
				data.cursor = div.id; // If no player is the cursor - make that player the selection
				$(div).addClass("cursor"); // Visual indicator (box shadow)
				$("#score-keys-toggle").fadeIn("fast"); // Toggle the score keys view (* 30 25 20 15 10 5)
			} else if (data.cursor == div.id){ // If the clicked player is the current selection - stop selection
				this.stopSelection();
			}
			
		}
	},

	addPlayer : function(color){
		data.render.players.push({"color" : color, "score" : 0});//Add to players
		for (var i = 0; i < data.render.colors.length; i++){
			if (data.render.colors[i] == color){
				var deleteIndex = i;
			}
		}
		data.render.colors.splice(deleteIndex, 1);//Delete from available colors;
	},

	removePlayer : function(color){		
		data.render.colors.push(color); //Add to colors
		for (var i = 0; i < data.render.players.length; i++){
			if (data.render.players[i].color == color){
				var deleteIndex = i;
			}
		}
		data.render.players.splice(deleteIndex, 1); // Remove from players.
	},

	renderPartial : function(partial){ // Render a smaller template, used to refresh some div tags.
		var template = data.partials[partial];
		var renderer = Handlebars.compile(template);
		var result = renderer(data.render);
		return result;
	},

	renderTemplate : function(view){ //Render the 2 views, start and game and all their sub-templates
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

	stopSelection : function(){ // Only in affect in game view, resets the keypad, scorekeys and cursor.
		$("#keypad-toggle").slideUp("fast");
		$("#score-keys-toggle").fadeOut("fast");
		$("#"+data.cursor).removeClass("cursor");
		data.cursor = 0;
	},

	getPercentages : function(){ // Render a column in the top bar in game view.
			for (i in data.render.players){
				if (data.render.players[i].color == data.cursor){
					var percentage = (data.render.players[i].score / data.render.limit) * 100; // Math bro
					percentage = Math.round(percentage);
					data.percentages[data.cursor] = percentage;					
					view.drawBar(data.cursor);
					if(percentage >= 100){
						this.resetGame(); // If someone exceeds or gets to the score limit -> reset game.
					}
				}				
			}			
			this.stopSelection();
	},

	resetGame : function(){
		for (i in data.render.players){
			data.render.players[i].score = 0; // All players score to 0
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
		var result = this.renderPartial("playerSelector") // Refresh the playerselector bar on the bottom to show the new score and remove the .status class
		$("#player-selector-refresh").html(result);
		this.getPercentages();
	}
};

var view = {
	init : function(){
		$.when( // Æla
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

	setListener : function(){ //Takkar
		$("#container").on("click", data.clickables, function(e){
					if ($(e.target).hasClass("num-key")){ //Keypad, 1 2 3 4 5 6 7 8 9 0 
						if(data.render.appendScore == 0){
							data.render.appendScore = $(e.target).text(); // Gluggi sem sýnir hvaða score þú ert að fara setja
						} else {
						data.render.appendScore = data.render.appendScore.toString() + $(e.target).text(); // Gluggi sem sýnir hvaða score þú ert að fara setja
					  }
						$("#append-score").text(data.render.appendScore); //Updatea gluggann.
					} else if ($(e.target).hasClass("player")){ // senda a playerhandler i octopus.
						octopus.playerHandler(e.target);
					} else if ($(e.target).hasClass("score-key") && $(e.target).text() != "*"){ //Fyrir scorekeys sem birtast f ofan player þegar hann er valinn.
							octopus.addScore($(e.target).text());		
					} else {
					switch(e.target.id){
						case "config-score":
							data.render.appendScore	= 0; // reseta "glugga" scorið í custom
							$("#append-score").text(data.render.appendScore);
							$("#keypad-toggle").fadeIn("fast"); // opna lyklaborð 1 2 3 4 5 6 7 8 9 0
							break;
						case "confirm-button": // Senda inn úr glugga sem stig
							var lastInt = data.render.appendScore; // Ath stig í þessum leik eru bara margfeldi af 5
							lastInt	= lastInt.toString();
							lastInt = lastInt[lastInt.length - 1];
							if(lastInt == 5 || lastInt == 0){ // Ef að seinasta talan er 5 eða 0 þá er í lagi að bæta við
								if (data.view == "game"){
									octopus.addScore(data.render.appendScore);
								}			
							} else {
								var rounded = 5*(Math.round(data.render.appendScore/5)); // Ef reynt er að bæta við sem endar ekki á 5 eða 0, þá er námundað
								data.render.appendScore = parseInt(rounded);
								if(data.view == "game"){
									$("#append-score").text(rounded); // "Warning" gefið í game view síðan þarf að ýta aftur til þess að senda inn
								}								
							}
							if (data.view == "start"){
								data.render.limit = data.render.appendScore; //Hér er notað keypad til þess að setja inn score limit.
								if(data.render.players.length > 0 && data.render.limit > 0){									
									view.draw("gameTemplate"); // Opna gameview svo lengi sem það er lokastig og amk einn player
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
							data.render.appendScore = 0; // * lykillinn á score keys borðinu, opnar lyklaborð og felur score keys
							$("#append-score").text(data.render.appendScore);
							$("#keypad-toggle").slideDown("fast");
							$("#score-keys-toggle").fadeOut("fast");
							break;
						case "score-limit": // Ef þú vilt breyta fjölda leikmanna í miðjum leik eða stigum
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
		$("#"+color+"-line").find(".status").attr("style", "width: "+data.percentages[color]+"%");
	}

};

view.init();

}());