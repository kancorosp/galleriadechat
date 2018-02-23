var app = {
    chat: function (channel) {
        var socket = io('/' + channel, {transports: ['websocket']});
        var colorList = ["color-1", "color-2", "color-3"];
        var userColors = {};
        var userId = '';  // User ID

        socket.on('connect', function (data) {
            //socket.emit('join', 'Join random room chat');
        });

        socket.on('joinRoomSuccess', function (roomId, userName, uId) {
            userId = uId;
            // Call API to update session
            $.post('/chat/join_room', {
                'roomId': roomId,
                'userName': userName
            });

            addNotice(userName + " 入りました");
        });

        socket.on('broad', function (data) {
            //$('#future').append(data + "<br/>");
            addMessage(data);
        });

        socket.on('init', function (data) {
            dialog.dialog("open");
        });

        socket.on('errorMessage', function (data) {
            alert('3人のメンバーが集まるまで、もう少々お待ちください。');
        });

        socket.on('removeRoom', function (data) {
            alert('ルームが解散します');
            window.location.href = '/';
        });

        socket.on('removeUser', function (data) {
            $('#user-' + data.userId).remove();
            addNotice(data.userName + " 退出しました");
        });

        socket.on('addNotice', function (notice) {
//            $('#' + data.userId).remove();
//            var html = `
//                     <li class="clearfix" id="user-${data.userId}">
//                         <img  alt="${data.userName}" />
//                         <div class="about">
//                            <div class="name">${user.userName}</div>
//                            <div class="status"><i class="fa fa-circle online"></i> online</div>
//                         </div>
//                     </li>`;
//            $(html).hide().appendTo('.chat-history ul').slideDown(200);
//
//            // Keep scroll bar down
//            $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);

            // Add notice
            addNotice(notice);
        });

        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function (data, clear) {
            var users = data.users;
            var $publicBtn = $('.public-btn');

            console.log(data);
            console.log(data.open);
            // Public room
            if (data.open) {
                $publicBtn.data('value', 1);
                $publicBtn.text('公開');
                // Private room
            } else {
                $publicBtn.data('value', 0);
                $publicBtn.text('非公開');
            }

            // Update user list
            $('.container p.message').remove();
            if (users.error != null) {
                $('.container').html(`<p class="message error">${users.error}</p>`);
            } else {
                updateUsersList(users, clear);
            }
        });


//        $('form').submit(function (e) {
//            e.preventDefault();
//            var message = $('#chat_input').val();
//            socket.emit('messages', message);
//        });

//        $('#join').on('click', function () {
//            var userName = $('#user_name').val()
//            socket.emit('join', userName);
//        });
        function joinChat() {
            var userName = $('#user_name').val()
            socket.emit('join', userName);
            dialog.dialog("close");
        }

        // Add message
        function addMessage(message) {
            message.date = (new Date(message.date)).toLocaleString();
            message.username = encodeHTML(message.username);
            message.content = encodeHTML(message.content);

            var html = `
                  <li class="${userColors[message.userId]}">
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                      <i class="fa fa-lg fa-thumbs-up like-icon"></i>
                    </div>
                    <span class="message my-message ${userColors[message.userId]}" dir="auto">${message.content}</span>
                  </li>`;
            $(html).hide().appendTo('.chat-history ul').slideDown(200);

            // Keep scroll bar down
            $(".chat-history").animate({scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
        }

        // Add notice to chat history
        function addNotice(content) {
            var html = `<li><div><span class="chat-notice">${content}</span></div></li>`;
            $(html).hide().appendTo('.chat-history ul').slideDown(200);
            //$(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
        }

        // Update users list
        function updateUsersList(users, clear) {
//            if(users.constructor !== Array){
//                users = [users];
//            }

            var html = '';
            var i = 0;
            for (var uId in users) {
                var userName = '';
                if (users.hasOwnProperty(uId)) {
                    userName = users[uId];
                }

                // Set color for each user
                if (!userColors.hasOwnProperty(uId)) {
                    for (var j = 0; j < 3; j++) {
                        if (Object.values(userColors).indexOf(colorList[j]) == -1) {
                            userColors[uId] = colorList[j];
                            break;
                        }
                    }
                }

                userName = this.encodeHTML(userName);
                html += `
                     <li class="clearfix" id="user-${uId}">
                         <img src="/img/user.jpg" alt="${userName}" />
                         <div class="about">
                            <div class="name">${userName}</div>
                            <div class="status"><i class="fa fa-circle online ${userColors[uId]}"></i> online</div>
                         </div>
                     </li>`;
            }

            if (html === '') {
                return;
            }

            if (clear != null && clear == true) {
                $('.users-list ul').html('').html(html);
            } else {
                $('.users-list ul').prepend(html);
            }

            console.log(userColors);
        }

        function encodeHTML(str) {
            return $('<div />').text(str).html();
        }


        // Send button clicked
        $('#message_send').on('click', function () {
            var content = $('#message_content').val();
            socket.emit('messages', content);
            $('#message_content').val('');
        });

        // Update room
        $('.public-btn').on('click', function () {
            var $this = $(this);
            var current = $this.data('value');
            console.log(current);

            // Change to private
            if (current) {
                if (confirm('ルームを非公開してよろしいでしょうか？')) {
                    socket.emit('updateRoom', 0);
//                    $this.data('value', 0);
//                    $this.text('非公開');
                }
            // Change room to public
            } else {
                if (confirm('ルームを公開してよろしいでしょうか？')) {
                    socket.emit('updateRoom', 1);
//                    $this.data('value', 1);
//                    $this.text('公開');
                }
            }
        });

        // Get out of room
        $('.escape-btn').on('click', function () {
            if (confirm('本当にルームを退出しますか？')) {
                // Call API to remove session
                $.get('/chat/left_room');

                socket.emit('leftRoom', true);

                window.location.href = '/';
            }
        });

        // Like a message
        $('body').on('click', '.like-icon', function () {
            var $liTag = $(this).closest('li');
            var message = $liTag.find('.message').text();

            var homeSocket = io('/home', {transports: ['websocket']});
            homeSocket.emit('addWitty', message);

            // Remove like button
            $liTag.find('.like-icon').remove();
        })

    }
};

