// constants
const BOARD_SIZE = 12;
const COLOR = ["", "red", "blue", "green", "yellow"];
const ATK_prob = 0.7;

// variables
let grid = Array.from(Array(BOARD_SIZE), () => new Array(BOARD_SIZE).fill(0));
let player_pos = Array.from(Array(5), () => new Array(2));
let player_num = 0;
let game_mode = "survive";
let out_player = [];
let round = 1;
let sec = 5;
let mainInterval;
let timerInterval;
let promised = [0, 0, 0, 0, 0];
let cant_move = [];
let flag_pos = [0, 0];
let player_area = [0, 0, 0, 0, 0];

// initialize grid
for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
        grid[i][j] = 0;
    }
}

function draw_main_game_area() {
    let temp = "";
    // table declare
    temp += "<table id=\"grid_table\"><tbody>";
    // table body
    for (let i = 0; i < BOARD_SIZE; i++) {
        temp += "<tr>";
        for (let j = 0; j < BOARD_SIZE; j++) {
            // assign each block with special id (position)
            temp += "<td class=\"grid_block\" id=\"block_" + i + "_" + j + "\">&emsp;</td>";
        }
        temp += "</tr>";
    }
    temp += "</tbody></table>";
    // append to html
    $("#main_game_area").html(temp);
}

function draw_control_area() {
    let temp = "";
    temp += "<table><tbody>";
    let cnt = 0;
    for (let i = 0; i < 3; i++) {
        temp += "<tr>";
        for (let j = 0; j < 3; j++) {
            // up, down, left, right buttons, and some blank buttons
            if (i == 0 && j == 1) {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_up\">&#8593;</button></td>";
            } else if (i == 1 && j == 0) {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_left\">&#8592;</button></td>";
            } else if (i == 1 && j == 1) {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_atk\" disabled>atk</button></td>";
            } else if (i == 1 && j == 2) {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_right\">&#8594;</button></td>";
            } else if (i == 2 && j == 1) {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_down\">&#8595;</button></td>";
            } else {
                temp += "<td><button class=\"ctrl\" id=\"ctrl_" + cnt + "\"></button></td>";
            }
            cnt++;
        }
        temp += "</tr>";
    }
    temp += "</tbody>";
    temp += "</table>";
    $("#control_area").html(temp);
}

function get_num_of_player() {
    let num = $("#num_of_player").val();
    return Number(num);
}

function draw_player(x, y, player_id) {
    // find the player
    let playerDiv = $("#player" + player_id);

    // if player doesn't exist
    if (playerDiv.length == 0) {
        // draw the player onto the grid
        $("#block_" + y + "_" + x).html("<div class=\"player\" id=\"player" + player_id + "\">" + player_id + "</div>");
        // update player
        playerDiv = $("#player" + player_id);
    } else {
        // add the player to another gird
        $("#block_" + y + "_" + x).append(playerDiv);
    }

    // change player's color
    playerDiv.css("background-color", COLOR[player_id]);
    // if promised, border bolder
    if (promised[player_id]) {
        playerDiv.css({
            "width": "3.5vh",
            "height": "3.5vh",
            "border-width": "0.5vh",
            "border-style": "solid",
            "border-color": "white"
        });
    } else {
        playerDiv.css("border", "none");
    }
}

function draw_flag(x, y) {
    $("#block_" + y + "_" + x).html(""); // clear &emsp;
    $("#block_" + y + "_" + x).html("<img src=\"img/flag.png\" id=\"flag\" style=\"width:4vh;height:4vh;\">");
    $("#flag").hide();
}

function erase_player(x, y) {
    // remove player from grid
    $("#block_" + y + "_" + x).html("&emsp;");
}

function create_player(player_num) {
    // draw players and update their positions
    switch (player_num) {
        case 4:
            draw_player(0, BOARD_SIZE - 1, 4);
            grid[0][BOARD_SIZE - 1] = 4;
            player_pos[4][0] = 0;
            player_pos[4][1] = BOARD_SIZE - 1;
            $("#player4").fadeIn(800);
        case 3:
            draw_player(BOARD_SIZE - 1, 0, 3);
            grid[BOARD_SIZE - 1][0] = 3;
            player_pos[3][0] = BOARD_SIZE - 1;
            player_pos[3][1] = 0;
            $("#player3").fadeIn(800);
        case 2:
            draw_player(BOARD_SIZE - 1, BOARD_SIZE - 1, 2);
            grid[BOARD_SIZE - 1][BOARD_SIZE - 1] = 2;
            player_pos[2][0] = BOARD_SIZE - 1;
            player_pos[2][1] = BOARD_SIZE - 1;
            draw_player(0, 0, 1);
            grid[0][0] = 1;
            player_pos[1][0] = 0;
            player_pos[1][1] = 0;
            $("#player2").fadeIn(800);
            $("#player1").fadeIn(800);
            break;
        default:
            break;
    }
}

function move_player(x, y, nx, ny, player_id) {
    // erase the player from old position
    erase_player(x, y);

    if (game_mode != "cap flag") {
        // previous gird become transparent according to player's color
        $("#block_" + y + "_" + x).css("background-color", COLOR[player_id]);
        $("#block_" + y + "_" + x).css("opacity", "0.5");
        // mark previous grid already traveled
        grid[y][x] *= 10;
    }
    else {
        // cap flag can travel back
        grid[y][x] = 0;
    }

    // draw player on new position
    draw_player(nx, ny, player_id);
    $("#player" + player_id).hide();
    $("#player" + player_id).fadeIn(300);
    grid[ny][nx] = player_id;

    // update player's position
    player_pos[player_id][0] = nx;
    player_pos[player_id][1] = ny;

    // calculate the player's area
    player_area[player_id]++;

    disable_controls();
    setTimeout(next_round, 100);

    let msg = "Player " + player_id + " move from (" + x + ", " + y + ") to (" + nx + ", " + ny + ").<br>";
    update_action_log(msg);

    play_audio_move();
}

function disable_controls() {
    $(".ctrl").off('click').attr("disabled", true);
    $(".grid_block").off('click');
    $("div.indicator").remove();
    $("#block_" + flag_pos[1] + "_" + flag_pos[0]).removeClass("get_flag");
}

function indicate(x, y) {
    // indicate the possible moving position
    if (game_mode != "cap flag") {
        $("#block_" + y + "_" + x).html("<div class=\"indicator\"></div>");
    }
    else {
        // cap flag when can capture the flag the border will become gold
        if (x == flag_pos[0] && y == flag_pos[1]) {
            $("#block_" + y + "_" + x).addClass("get_flag");
        }
        else {
            $("#block_" + y + "_" + x).html("<div class=\"indicator\"></div>");
        }
    }
}

function enable_controls(player_id) {
    // get current player position
    let xx = player_pos[player_id][0];
    let yy = player_pos[player_id][1];

    // check which direction can move to
    let cnt = 0;
    if ((yy - 1 >= 0) && grid[yy - 1][xx] == 0) {
        cnt++;
        $("#ctrl_up").attr("disabled", false);
        $("#ctrl_up").click(function() {move_player(xx, yy, xx, yy - 1, player_id)});
        $("#block_" + (yy - 1) + "_" + xx).click(function() {move_player(xx, yy, xx, yy - 1, player_id)});
        indicate(xx, yy - 1);
    }
    if ((yy + 1 < BOARD_SIZE) && grid[yy + 1][xx] == 0) {
        cnt++;
        $("#ctrl_down").attr("disabled", false);
        $("#ctrl_down").click(function() {move_player(xx, yy, xx, yy + 1, player_id)});
        $("#block_" + (yy + 1) + "_" + xx).click(function() {move_player(xx, yy, xx, yy + 1, player_id)});
        indicate(xx, yy + 1);
    }
    if ((xx - 1 >= 0) && grid[yy][xx - 1] == 0) {
        cnt++;
        $("#ctrl_left").attr("disabled", false);
        $("#ctrl_left").click(function() {move_player(xx, yy, xx - 1, yy, player_id)});
        $("#block_" + yy + "_" + (xx - 1)).click(function() {move_player(xx, yy, xx - 1, yy, player_id)});
        indicate(xx - 1, yy);
    }
    if ((xx + 1 < BOARD_SIZE) && grid[yy][xx + 1] == 0) {
        cnt++;
        $("#ctrl_right").attr("disabled", false);
        $("#ctrl_right").click(function() {move_player(xx, yy, xx + 1, yy, player_id)});
        $("#block_" + yy + "_" + (xx + 1)).click(function() {move_player(xx, yy, xx + 1, yy, player_id)});
        indicate(xx + 1, yy);
    }
    // check if player can't move or not
    if (!cnt) {
        if (!cant_move.includes(player_id)) {
            cant_move.push(player_id)
        }
        // console.log(player_id + "cant move");
    }

    // check if attack
    let atk_enable = false;
    let online_ene = [];
    // find enemy to attack
    for (let i = 1; i <= player_num; i++) {
        if (i != player_id && !out_player.includes(i)) {
            let enemy_x = player_pos[i][0];
            let enemy_y = player_pos[i][1];
            if (enemy_x === xx || enemy_y === yy) {
                atk_enable = true;
                online_ene.push(i);
            }
        }
    }
    // update attack button
    if (atk_enable && game_mode != "area") {
        $("#ctrl_atk").attr("disabled", false).click(function() {attack(player_id, online_ene)});
        return atk_enable;
    }
}

function next_round() {
    // check if game over first
    let game_status = is_game_over(game_mode);
    if (game_mode == "survive") {
        if (game_status == 1) {
            declare_winner("");
            return;
        }
        else if (game_status == 2) {
            no_one_can_move();
            return;
        }
    }
    else if (game_mode == "cap flag") {
        let temp = game_status / 100; 
        if (temp >= 1 && temp <= player_num) {
            declare_winner(temp);
            return;
        }
    }
    else {
        if (game_status == 1000) {
            calculate_area();
            return;
        }
    }

    // move to next player, exclude the player already dead
    do {
        round++;
        if (round > player_num) {
            round = 1;
        }
    } while (out_player.includes(round));

    // reset timer
    sec = 5;
    $("#5sec_timer").html(sec);
    draw_timer(sec, COLOR[round]);
    // start a five second round
    a_round(round);
}

function a_round(player_id) {
    // double check current player is still alive
    if (out_player.includes(player_id)) {
        next_round();
        return;
    }

    // check current player still can move
    if (cant_move.includes(player_id)) {
        let msg = "Player " + player_id + " can't make any move.<br>";
        update_action_log(msg);

        if (enable_controls(player_id) && game_mode != "area") {
            console.log("cant move but can attack");
            let msg = "But player " + player_id + " has a chance to attack.<br>";
            update_action_log(msg);
        }
        else {
            next_round();
            return;
        }
    }

    // change the border color
    $("#main_game_area").css("border-color", COLOR[player_id]);
    // reset and enable control
    disable_controls();
    enable_controls(player_id);

    // main 5 second interval
    clearInterval(mainInterval);
    set_mainInterval(player_id);
}

function set_mainInterval(player_id) {
    // update timer
    $("#5sec_timer").html(sec);
    draw_timer(sec, COLOR[player_id]);
    // check if 5 second is up
    if (sec <= 0) {
        next_round();
        let msg = "Player " + player_id + " 5 second timeout.<br>";
        update_action_log(msg);
    }
    mainInterval = setInterval(function() {
        // update timer
        sec--;
        $("#5sec_timer").html(sec);
        draw_timer(sec, COLOR[player_id]);
        // check if 5 second is up
        if (sec <= 0) {
            next_round();
            let msg = "Player " + player_id + " 5 second timeout.<br>";
            update_action_log(msg);
        }
    }, 1000);
}

function attack(player_id, online_ene) {
    // random number generate
    let num = Math.random();
    // check if promised or can attack
    if (promised[player_id] == 1 || num >= ATK_prob) {
        // kill the player on the col or row
        for (let a_ene of online_ene) {
            let x = player_pos[a_ene][0];
            let y = player_pos[a_ene][1];
            erase_player(x, y);
            grid[y][x] = -1;
            $("#block_" + y + "_" + x).css("background-color", "black");
            out_player.push(a_ene);
            play_audio_atk();
        }
        // reset promise
        promised[player_id] = 0;
        // border become normal
        erase_player(player_pos[player_id][0], player_pos[player_id][1]);
        draw_player(player_pos[player_id][0], player_pos[player_id][1], player_id);

        let msg = "Player " + player_id + " attack successfully. ";
        msg += ("Player " + online_ene + " died.<br>");
        update_action_log(msg);
    } else {
        // border bolder and set promised
        $("#player" + player_id).css({
            "width": "3.5vh",
            "height": "3.5vh",
            "border-width": "0.5vh",
            "border-style": "solid",
            "border-color": "white"
        });
        promised[player_id] = 1;
        let msg = "Player " + player_id + " attack failed, he is promised.<br>";
        update_action_log(msg);
        play_audio_atk_fail();
    }

    disable_controls();
    setTimeout(next_round, 500);
}

function gen_flag() {
    // generate flag at the middle of the board
    x = Math.floor(Math.random() * 2);
    y = Math.floor(Math.random() * 2);
    draw_flag(BOARD_SIZE / 2 - 1 + x, BOARD_SIZE / 2 - 1 + y);
    // update board position
    flag_pos[0] = BOARD_SIZE / 2 - 1 + x;
    flag_pos[1] = BOARD_SIZE / 2 - 1 + y;
}

function game_start() {
    // get player number and create player
    player_num = get_num_of_player();
    console.log(game_mode);
    $("#init_input").fadeOut(500);
    $("#init_msg").fadeOut(500);
    $("#fog").fadeOut(500);

    update_action_log("Game mode: " + game_mode + "<br>");
    update_action_log("Get ready!<br>");
    
    $("#main_game_area").animate({marginLeft: "0%"}, 500);
    create_player(player_num);
    $("#right_side_area").fadeIn(500);
    $(".spacer").show();

    // timer initialize
    round = 1;
    sec = 5;
    draw_timer(sec, COLOR[round], true);

    console.log(game_mode);
    if (game_mode == "cap flag") {
        gen_flag();
        $("#flag").fadeIn(500);
    }

    // start a round after a sec
    setTimeout(function() {
        update_action_log("Game start!<br>");
        $("#5sec_timer").html(sec);
        play_audio_clock();
        draw_timer(sec, COLOR[round]);
        a_round(round);
        $("#pause").attr("disabled", false);
        $("#mute").attr("disabled", false);
        play_audio_go();
    }, 1000);

    // pause the game
    $("#pause").click(function() {
        $(this).addClass("btn_active");
        $("#pause_msg").fadeIn(500);
        $("#fog").fadeIn(500);
        $("#resume").attr("disabled", false);
        $("#restart").attr("disabled", false);
        clearInterval(mainInterval);
        clearInterval(timerInterval);
    });

    // mute the audio
    $("#mute").click(function() {
        if ($(this).hasClass("btn_active")) {
            $(this).removeClass("btn_active");
            $("audio").prop("muted", false);
        }
        else {
            $(this).addClass("btn_active");
            $("audio").prop("muted", true);
        }
    });

    // resume from pause
    $("#resume").click(function() {
        $("#resume").attr("disabled", true);
        $("#pause_msg").fadeOut(500);
        $("#fog").fadeOut(500);
        $("#pause").removeClass("btn_active");
        $("#restart").attr("disabled", false);  
        set_mainInterval(round);
    });

    // restart the game
    $("#restart").click(function() {
        location.reload();
    });
}

function is_game_over(game_mode) {
    if (game_mode == "survive") {
        // check if one player still alive
        if (out_player.length == player_num - 1) return 1;
        else if (cant_move.length == (player_num - out_player.length)) return 2;
    }
    else if (game_mode == "cap flag") {
        let winner;
        for (let i = 1; i <= player_num; i++) {
            console.log(flag_pos);
            if (player_pos[i][0] == flag_pos[0] && player_pos[i][1] == flag_pos[1]) {
                winner = i;
                console.log(winner);
                return winner * 100;
            }
        }
    }
    else if (game_mode == "area") {
        if (cant_move.length == (player_num - out_player.length)) return 1000;
    }
    return 0;
}

function declare_winner(winner) {
    if (game_mode == "survive") {
        // find the one still alive
        for (let i = 1; i <= player_num; i++) {
            if (!out_player.includes(i)) {
                winner = i;
                break;
            }
        }
    }

    let msg = "Player" + winner + " wins the game.";
    update_action_log(msg);
    console.log("Game Over! Player " + winner + " wins!");

    let btn_str = "<br><button id=\"play_again\">Play Again</button>"
    $("#game_over_msg").html(msg + btn_str);
    $("#fog").fadeIn(500);
    $("#game_over_msg").fadeIn(500);

    clearInterval(mainInterval);
    clearInterval(timerInterval);

    $("#play_again").attr("disable", false);
    
    play_audio_win();

    $("#play_again").click(function() {
        location.reload();
    });
}

function no_one_can_move() {
    let msg = "No one can move anymore, game over.";
    update_action_log(msg);

    console.log("No one can move anymore, game over.");
    let btn_str = "<br><button id=\"play_again\">Play Again</button>"

    $("#game_over_msg").html(msg + btn_str);
    $("#fog").fadeIn(500);
    $("#game_over_msg").fadeIn(500);

    clearInterval(mainInterval);
    clearInterval(timerInterval);
    $("#play_again").attr("disable", false);
    play_audio_gameover();

    $("#play_again").click(function() {
        location.reload();
    });
}

function calculate_area() {
    let msg = "No one can move anymore. Calculate the area.<br>";

    // find the player with most area
    console.log(player_area);
    let max_area = Number(Math.max(...player_area));
    console.log(max_area);
    let winner = [];
    for (let i = 1; i <= player_num; i++) {
        if (player_area[i] == max_area) {
            winner.push(i);
        }
    }
    // console.log(winner);

    msg += "Player" + winner + " has max area " + max_area + "!<br>";
    update_action_log(msg);
    let btn_str = "<br><button id=\"play_again\">Play Again</button>"

    $("#game_over_msg").html(msg + btn_str);
    $("#fog").fadeIn(500);
    $("#game_over_msg").fadeIn(500);

    clearInterval(mainInterval);
    clearInterval(timerInterval);
    $("#play_again").attr("disable", false);
    play_audio_win();

    $("#play_again").click(function() {
        location.reload();
    });
}

function update_action_log(str) {
    let old_str = $("#action_log").html();
    $("#action_log").html(old_str + str);
}

$(document).ready(function(){
    // draw
    draw_main_game_area();
    draw_control_area();
    $("#init_input").fadeIn(500);
    $("#init_msg").fadeIn(500);
    $("#fog").fadeIn(500);
    $("#right_side_area").hide();
    $(".spacer").hide();
    disable_controls();

    // audio initialize
    $("body").click(function() {
        let audio_bgm = document.getElementById("audio_bgm");
        audio_bgm.play();
        let audio_clock = document.getElementById("audio_clock");
        audio_clock.volume = 0.4;
        let audio_move = document.getElementById("audio_move");
        audio_move.volume = 0.4;
    });

    // # player select
    $(".num_player").click(function() {
        $(".num_player").not(this).removeClass("btn_active");
        $(this).addClass("btn_active");
        let numPlayerValue = $(this).attr('id');
        $("#num_of_player").val(Number(numPlayerValue));
    });

    // game mode select
    $(".game_mode").click(function() {
        $(".game_mode").not(this).removeClass("btn_active");
        $(this).addClass("btn_active");
        game_mode = $(this).attr('id');
        console.log(game_mode);
    });

    // wait input and start
    $("#start").click(function() {
        game_start();
    });
});

function draw_timer(sec, color, stall = false) {
    sec = Number(sec);
    clearInterval(timerInterval);
    if (stall) {
        let canvas = document.getElementById("5_sec_timer");
        let ctx = canvas.getContext("2d"); 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height * 0.4 - 5, Math.PI * 1.5, 2 * Math.PI / 5 * sec + Math.PI * 1.5);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.font = "bold 20px Arial";
        let rs = Math.round(sec * 10) / 10;
        if ((rs * 10) % 10 == 0) rs += ".0"
        ctx.fillStyle = "black";
        ctx.fillText(rs + "s", 0, 22);
        ctx.stroke();
        return;
    }
    play_audio_clock();
    timerInterval = setInterval(function() {
        let canvas = document.getElementById("5_sec_timer");
        let ctx = canvas.getContext("2d"); 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height * 0.4 - 5, Math.PI * 1.5, 2 * Math.PI / 5 * sec + Math.PI * 1.5);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.font = "bold 20px Arial";
        let rs = Math.round(sec * 10) / 10;
        if ((rs * 10) % 10 == 0) rs += ".0"
        ctx.fillStyle = "black";
        ctx.fillText(rs + "s", 0, 22);
        ctx.stroke();
        sec -= 0.2;
    }, 200);
};

function play_audio_clock() {
    let audio_clock = document.getElementById("audio_clock");
    audio_clock.currentTime = 0;
    audio_clock.play();
}

function play_audio_move() {
    let audio_move = document.getElementById("audio_move");
    audio_move.currentTime = 0;
    audio_move.play();
}

function play_audio_atk() {
    let audio_atk = document.getElementById("audio_atk");
    audio_atk.currentTime = 0;
    audio_atk.play();
}

function play_audio_atk_fail() {
    let audio_atk_fail = document.getElementById("audio_atk_fail");
    audio_atk_fail.currentTime = 0;
    audio_atk_fail.play();
}

function play_audio_win() {
    let audio_win = document.getElementById("audio_win");
    audio_win.currentTime = 0;
    audio_win.play();
}

function play_audio_gameover() {
    let audio_gameover = document.getElementById("audio_gameover");
    audio_gameover.currentTime = 0;
    audio_gameover.play();
}

function play_audio_go() {
    let audio_go = document.getElementById("audio_go");
    audio_go.currentTime = 0;
    audio_go.play();
}
