$(document).ready(function(){

				/* Application Data */
				var teamInfo = new Object();
				teamInfo.foldScore = 25;
				teamInfo.teamName = 'My Team';
				teamInfo.totalScore = 210;
				teamInfo.teamMembers = [];
				teamInfo.errorMessages = {
					noPlayers:'Forgot to register player',
					noPlayerName:'Please enter player name',
					name_exists:'Name already registered'
				};

				/* Instance that holds each player details */
				function Player(name){
					this.name = name;
					this.score = 0;
					this.numFolds = 0;
					this.scores = [];
					this.addScore = function(score){
						this.scores.push(score);
						this.score += parseInt(score);
						return this.score;
					};
					this.getPlayerName = function(){
						return this.name;
					},
					this.addFoldScore = function(score){
						this.numFolds++;
						return this.addScore(score);
					};
				}

				/* Utility functions for the entire application */
				var appUtilities = new Object();
				appUtilities.appendHeader = function(message, leftNavType, needAddUser){
					if(leftNavType === 'home')
						return Mustache.render($('#headerContent').html(), {isHome: true, message: message, needAddUser: needAddUser});
					else
						return Mustache.render($('#headerContent').html(), {isHome: false, message: message, needAddUser: needAddUser});
				};
				appUtilities.deletePlayer = function(givenName){
					teamInfo.teamMembers = _.filter(teamInfo.teamMembers, function(member){
						return member.name !== givenName;
					});
				};
				appUtilities.getWrappedPlayersJSON = function(){
					var jsonObj = new Object();
					jsonObj.players = teamInfo.teamMembers;
					var json2 = JSON.stringify(jsonObj),
						result = $.parseJSON(json2);
					result.isNotEmpty = (teamInfo.teamMembers.length > 0);
					console.log(result);
					return result;
				};
				appUtilities.printPlayersInfo = function(){
					_.each(teamInfo.teamMembers, function(member){
						console.log(member);
					});
				};
				appUtilities.getPlayerInfoByName = function(name){
					return _.find(teamInfo.teamMembers, function(player){
						return player.name.toUpperCase() === name.toUpperCase();
					});
				};
				appUtilities.resetAppInfo = function(){
					teamInfo.foldScore = 25;
					teamInfo.teamName = 'My Team';
					teamInfo.totalScore = 210;
					teamInfo.teamMembers = [];
				};

				/* Router for the application */
				var GameRouter = Backbone.Router.extend({
					initialize: function(){
						this.mainContentView = new MainContentView();
						this.userMangementView = new UserMangementView();
						this.gameBoardView = new GameBoardView();
						this.playerDetailView = new PlayerDetailView();
					},
					routes: {
						'': 'mainContentCall',
						'userManagementCall': 'userManagementCall',
						'gameBoardViewCall': 'gameBoardViewCall',
						'playerDetailCall?:name': 'playerDetailViewCall'
					},
					mainContentCall: function(){
						appUtilities.resetAppInfo();
						this.mainContentView.render();		
					},
					userManagementCall: function(){
						this.userMangementView.render();
					},
					gameBoardViewCall: function(){
						this.gameBoardView.render();
					},
					playerDetailViewCall: function(name){
						this.playerDetailView.render(name);
					}
				});

				/* Player details View */
				var PlayerDetailView = Backbone.View.extend({
					initialize: function(){

					},
					el:'#mainContent',
					events:{
						'click #backButton': 'navigateToGameBoardView'
					},
					render: function(playerName){
						this.$el.empty();
						var player = appUtilities.getPlayerInfoByName(playerName),
							json = JSON.stringify(player)
							json2 = $.parseJSON(json);
						var template = $('#playerDetailTemplate').html();
						this.$el.html(Mustache.render(template, json2)).trigger('create');
					},
					navigateToGameBoardView: function(event){
						router.navigate('gameBoardViewCall', {trigger: true});
					}
				});

				/* View for Game Board */
				var GameBoardView = Backbone.View.extend({
					initialize: function(){

					},
					el: '#mainContent',
					events: {
						'click #addScoreBtn' : 'addScoreBtnClick',
						'click #foldBtn': 'foldBtnClick',
						'click #userNameBtn': 'navigatePlayerDetailView',
						'click #backButton': 'handleBackButtonClick'
					},
					render: function(){
						this.$el.empty();
						var json = appUtilities.getWrappedPlayersJSON();
						console.log(json);
						this.$el.append(appUtilities.appendHeader("Game "+teamInfo.teamName, 'back', false)).trigger('create');
						var template = $('#gameTemplate').html();
						var view = Mustache.render(template, json);
						this.$el.append(view).trigger('create');
					},
					addScoreBtnClick: function(event){
						var tr = $(event.target).closest('tr'),
						playerScoreText = tr.find('#playerScoreText'),
						playerName = tr.find('#userNameBtn').text();
						
						if(playerName !== '' && playerScoreText.val() !== ''){
							var updatedScore = this.addScoreToPlayer(playerName, playerScoreText.val(), false);
							tr.find('#scoreBtn').text(updatedScore);
						}						
						/* Updating the details */
						playerScoreText.val('');
						appUtilities.printPlayersInfo();
					},
					foldBtnClick: function(event){
						var tr = $(event.target).closest('tr'),
						playerName = tr.find('#userNameBtn').text();

						if(playerName !== ''){
							tr.find('#scoreBtn').text(updatedScore);
							var updatedScore = this.addScoreToPlayer(playerName, teamInfo.foldScore, true);
						}
						/* Updating details */
						tr.find('#scoreBtn').text(updatedScore);
						appUtilities.printPlayersInfo();
					},
					addScoreToPlayer: function(name, score, isFold){
						var player = appUtilities.getPlayerInfoByName(name);
						if(isFold)
							player.addFoldScore(score);
						else
							player.addScore(score);
						return player.score;
					},
					navigatePlayerDetailView: function(event){
						var tr = $(event.target).closest('tr'),
						playerName = tr.find('#userNameBtn').text();
						router.navigate('playerDetailCall?'+playerName, {trigger:true});
					},
					handleBackButtonClick: function(){
						window.history.back();
					}
				});

				/* View for Inserting the users */
				var UserMangementView = Backbone.View.extend({
					el:'#mainContent',
					events: {
						'click #startGameBtn': 'navigateToStartGame',
						'click #addIndividualUser': 'addIndividualUser',
						'click #removeIndividualUser': 'removeIndividualUser',
						'click #addUserBtn': 'addUserBtn',
						'click #homeButton': 'navigateHome'
					},
					initialize: function(){
					},
					render: function(){
						this.$el.empty();
						var header = appUtilities.appendHeader('Add Players in '+teamInfo.teamName, 'home', true);
						this.$el.append(header).trigger('create');
						var json = appUtilities.getWrappedPlayersJSON();
						this.$el.append(Mustache.render($('#addUserTemplate').html(), json)).trigger('create');
					},
					renderRegisteredUsers: function(){

					},
					addUserBtn: function(event){
						if(teamInfo.teamMembers.length)
							this.addUser();
					},
					addUser: function(){
						$(this.$el.find('#addUserTableDiv')).prepend(this.getAddUserTemplate()).trigger('create');
					},
					removeIndividualUser: function(event){
						var tableEle = $(event.target).closest('table');
							playerNameTextEle = $(tableEle).find('#userNameEle'),
							playerName = playerNameTextEle.val();
						appUtilities.deletePlayer(playerName);
						$(tableEle).remove();
						if(!this.getAllUserNameTextEle().length)
							this.addUser();
					},
					addIndividualUser: function(event){
						var tr = $(event.target).closest('tr'),
							playerNameTextEle = tr.find('#userNameEle'),
							errorMessage = tr.find('#errorMessage'),
							playerName = playerNameTextEle.val();
						if(!_.isUndefined(appUtilities.getPlayerInfoByName(playerName))){
							errorMessage.text(teamInfo.errorMessages.name_exists);
						} else if(playerName !== ''){
							teamInfo.teamMembers.push(new Player(playerName));
							$(playerNameTextEle).addClass('ui-state-disabled');
							$(event.target).addClass('ui-state-disabled');
							/* Remove error Message if exists */
							errorMessage.text('');
						} else {
							errorMessage.text(teamInfo.errorMessages.noPlayerName);
						}
					},
					isAnyEmptyNamed: function(){
						var elements = this.getAllUserNameTextEle();
						var test = _.find(elements, function(ele){
							return $(ele).val() === '';
						});
						return _.isUndefined(test);
					},
					navigateToStartGame: function(){
						if(!teamInfo.teamMembers.length)
							$(this.$el).find('#errorMessage').text(teamInfo.errorMessages.noPlayers);
						else
							router.navigate('gameBoardViewCall', {trigger:true});
					},
					navigateHome: function(){
						router.navigate('',{trigger:true});
					},
					getAddUserTemplate: function(){
						return $($('#addUserTemplate').html()).find('table');
					},
					getAllUserNameTextEle: function(){
						return $('[id=userNameEle]');
					}
				});

				/* Main view for the application */
				var MainContentView = Backbone.View.extend({
					el:'#mainContent',
					events: {
						'click #renderUserManagement':'navigateToUserManagement'
					},
					initialize: function(){
					},
					render: function(){
						this.$el.empty();
						var header = appUtilities.appendHeader("Welcome to Rummy Game Board",'home', false);
						var template = $('#mainTemplate').html();
						this.$el.append(header).trigger('create');
						this.$el.append(template).trigger('create');
					},
					navigateToUserManagement: function(){
						var teamName = $('#teamName').val(),
							totalScore = $('#gameTotalScore').val(),
							foldScore = $('#foldScore').val();
						
						if(teamName !== '')
							teamInfo.teamName = teamName;
						if(totalScore !== '')
							teamInfo.totalScore = totalScore;
						if(foldScore !== '')
							teamInfo.foldScore = foldScore;

						router.navigate('userManagementCall', {trigger: true});
					}
				});

				/* Initantiate the Router here, this starts the application*/
				var router = new GameRouter();
				Backbone.history.start();
			});