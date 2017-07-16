/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
	/**
	 * 获取服务器的地址
	 */
	owner.getServerUrl = function() {
		var stateText = localStorage.getItem('$serverUrl') || 'http://cdhapi.zzfangu.com';

		return stateText;
	};
	/**
	 * 设置服务器的地址
	 * @param {Object} url
	 */
	owner.setServerUrl = function(url) {
		url = url || 'http://cdhapi.zzfangu.com';
		localStorage.setItem('$serverUrl', url);
	};
	/**
	 * 用户登录
	 **/
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		var reg = /^1[3|4|5|7|8][0-9]{9}$/;  // 验证规则
		if (!reg.test(loginInfo.account)) {
			return callback('账号为11位手机号');
		}
		if (loginInfo.password.length < 8) {
			return callback('密码最短为 8 个字符');
		}
		
		// 连接服务器
		mui.ajax(this.getServerUrl() + "/token", {
			data: {
				password: loginInfo.password,
				username: loginInfo.account,
				grant_type: "password"
			},
			dataType: 'json', //服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			success: function(data, textStatus, xhr) {
				if(data) {
					data.pwd = loginInfo.password;
					return owner.createState(data, callback);
				} else {
					return callback('用户名或密码错误');
				}
			},
			error: function(xhr, type, errorThrown) {
				if(xhr && xhr.response){
					var result = JSON.parse(xhr.response);
					if(result.error === 'invalid_grant'){
						return callback(result.error_description);
					}
				}
				return callback('用户名或密码错误');
			}
		});
	};

	owner.createState = function(loginfo, callback) {
		// 获取用户信息
		mui.ajax(this.getServerUrl() + "/api/Account/get", {
			data: {
				"username": loginfo.userName
			},
			headers: {
				"Authorization": "Bearer " + loginfo.access_token
			},
			dataType: 'json',
			type: 'get',
			timeout: 10000,
			success: function(data) {
				if(data.status && data.data) {
					var state = owner.getState();
					state.account = loginfo.userName;
					state.token = loginfo.access_token;
					state.pwd = loginfo.pwd;
					state.accountid = data.data.userId;
					state.realname = data.data.realName;
					owner.setState(state);
					return callback();
				} else {
					return callback("用户名或密码错误");
				}
			},
			error: function(xhr, type, errorThrown) {
				return callback("用户名或密码错误");
			}
		});
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		
		// 连接服务器
		mui.ajax(this.getServerUrl() + "/api/Account/Register", {
			data: JSON.stringify({
				password: regInfo.password,
				username: regInfo.account,
				//grant_type: "password"
			}),
			contentType: 'application/json',
			dataType: 'json', //服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			success: function(data, textStatus, xhr) {
				console.log(JSON.stringify(data));
				if(data.status === true) {
					return callback();
				} else {
					return callback(data.message || '注册用户失败');
				}
			},                                                                                                                                                                                                                                                                                                     
			error: function(xhr, type, errorThrown) {
				console.log(errorThrown);
				return callback('注册用户失败');
			}
		});
		
//		var users = JSON.parse(localStorage.getItem('$state') || '{}');
//		users.push(regInfo);
//		localStorage.setItem('$state', JSON.stringify(users));
		//return callback();
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
		/**
		 * 获取本地是否安装客户端
		 **/
	owner.isInstalled = function(id) {
		if (id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	};
	
	// 注册导航点击事件
	owner.MenuInit = function(activeTab) {
		//选项卡点击事件
		$('.mui-bar-tab').on('tap', 'a', function(e) {
			var dataId = this.getAttribute('data-id');
			if(activeTab == dataId) {
				return;
			}

			owner.preateHide(dataId,{intrance:activeTab});
			plus.webview.hide(activeTab);
		});
	}
	// 页面跳转
	owner.preateHide = function(e, data) {
		debugger;
		var extras={extras:data};
		
		if(e !== 'index.html' && e != 'login.html' && e != 'regist.html' && e != 'about.html' && e != 'cate.html' && e != 'culture.html' && e != 'culture_detail.html'){
			var $state = this.getState();
			if(!$state.accountid){
				owner.preateHide('login.html',extras);
				return;
			}
		}
		if(e === 'pay.html'){
			debugger;
		}
		// 隐藏当前窗口
		var now = plus.webview.currentWebview();
		now.hide();
		var p = e==='index.html' ? plus.webview.getLaunchWebview() : plus.webview.getWebviewById(e);
		if(!p) {
			var w = plus.webview.create(e, e, {}, extras);
			w.hide();
			//						ws.append(w);
			w.show("fade-in", plus.os.ios ? 300 : 700);
			return;
		}

		$.fire(p, 'show', extras);
		p.show('none');
	};
	
	owner.onError = function(errcode){
	    switch(errcode){
		    case 'FAILED_NETWORK':
		        plus.nativeUI.toast('网络不佳');
		        break;
		    case 'Unauthorized':
		    	console.log('认证失败!');
		    	owner.preateHide('login.html',{});
		        break;
		    default:
		    	plus.nativeUI.toast('网络不佳');
		        console.log(errcode);
	    }
	};
	
	owner.hasClass = function (obj, cls) {  
	    return !!obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));  
	}  
	  
	owner.addClass = function(obj, cls) {  
	    if (!owner.hasClass(obj, cls)) obj.className += " " + cls;  
	}  
	  
	owner.removeClass=function(obj, cls) {  
	    if (owner.hasClass(obj, cls)) {  
	        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');  
	        obj.className = obj.className.replace(reg, ' ');  
	    }  
	}  
	  
	owner.toggleClass=function(obj,cls){  
	    if(owner.hasClass(obj,cls)){  
	        owner.removeClass(obj, cls);  
	    }else{  
	        owner.addClass(obj, cls);  
	    }  
	}  
	  
	owner.toggleClassTest=function(){  
	    var obj = document. getElementById('test');  
	    owner.toggleClass(obj,"testClass");  
	}
	
	owner.getradiovalue = function(obj){
		var radio = document.querySelectorAll(obj);
	    for (i=0; i<radio.length; i++) {  
	        if (radio[i].checked) {  
	            return radio[i].value;
	        }  
	    }
	    
	    return null;
	};
	
}(mui, window.app = {}));