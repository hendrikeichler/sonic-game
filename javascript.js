var fase; // número da fase do jogo
var energia; // quantidade de energia (100 - máximo, 0 - mínimo -> fim de jogo)
var pontos; // pontuação no jogo
var nobstaculos; // número de obstáculos que surgem em uma fase
var saltando; // indica se o personagem está saltando
var salto_ok; // indica se o personagem fez um salto OK
var saltou; // indica se o personagem saltou durante a passagem de um obstáculo (se não saltou houve colisão)
var conta_obstaculos; // número de obstáculos que já passaram em uma fase
var vel_fundo; // velocidade do fundo (em pixels/s)
var vel_1o_plano; // velocidade do 1o plano (em pixels/s)
var animObstaculo;
var ken, contador = 0;
var hadouken = new Audio('sounds/hadouken.mp3');
var lifeLost = new Audio('sounds/lifelost.wav');
var changeLevel = new Audio('sounds/changelevel.mp3');
var coin = new Audio('sounds/coin.mp3');
var fight = new Audio('sounds/fight.mp3');
var start = new Audio('sounds/start.mp3');
var you = new Audio('sounds/you.mp3');
var lose = new Audio('sounds/lose.mp3');
var death = new Audio('sounds/death.mp3');
var backgroundSong = new Audio('sounds/backgroundSong.mp3');
backgroundSong.loop = true;


var ts_inicio_anim_obs; // timestamp do início da animação do obstáculo

var WIDTH_PLANO_DE_FUNDO = 3180; // número de pixels da largura da imagem de fundo
var WIDTH_JANELA = 1064; // número de pixels da largura da janela

// função chamada no início (ou reinício) do jogo
function inicio() {
    //console.log("inicio()");

    //inicialização de variáveis
    start.play(); 
    fase = 1;
    nobstaculos = 15;
    vel_fundo = 50;
    vel_1o_plano = 400;    
    limpa_displays();
    setTimeout(function(){
      backgroundSong.play();
      ken = window.document.getElementById("personagemKen");
      ken.className = 'hadouken_ken';
    },2500); 
    seta_listeners();
    inicia_fase();

    //setTimeout(function(){
    //  IniciaAnimacaoObstaculo();
    //},2850); 

}

// função para limpeza dos displays de energia e pontos
function limpa_displays() {
    //console.log("limpa_displays()");
    pontos = 0;
    energia = 100;
    atualiza_display_energia();
    atualiza_display_pontos();
}

// função para atualizar displays de energia
function atualiza_display_energia() {
    //console.log("atualiza_display_energia()");
    var el = window.document.getElementById("lifeBarStatus");
    if (!el)
        return;
    el.style.width = energia+'%';
}

// função para atualizar displays de pontos
function atualiza_display_pontos() {
    //console.log("atualiza_display_pontos()");
    var el = window.document.getElementById("points");
    if (!el)
        return;
    el.innerHTML = pontos;
}

// função para associar funções de tratamento para os momentos de término de animação
function seta_listeners() {
    //console.log("seta_listeners");

    // seta função fim_de_salto para ser chamada quando acabar o salto do personagem
    var pers_el = window.document.getElementById("personagem");
    pers_el.addEventListener("webkitAnimationEnd", fim_do_salto);
    pers_el.addEventListener("animationend", fim_do_salto);
    pers_el.focus();

    // seta função conta_iteracao para ser chamada quando acabar a passagem de um obstáculo
    var obstaculo_el = window.document.getElementById("obstaculo1");
    obstaculo_el.addEventListener("webkitAnimationEnd", final_anim_obstaculo);
    obstaculo_el.addEventListener("animationend", final_anim_obstaculo);
    
    var ken = window.document.getElementById("personagemKen");
    ken.addEventListener("animationiteration", IniciaAnimacaoObstaculo, false);
    ken.addEventListener("webkitAnimationIteration", IniciaAnimacaoObstaculo, false);
    ken.addEventListener("mozAnimationIteration", IniciaAnimacaoObstaculo, false);
    ken.addEventListener("MSAnimationIteration", IniciaAnimacaoObstaculo, false);
    ken.addEventListener("oanimationiteration", IniciaAnimacaoObstaculo, false);
}

// função para iniciar uma nova fase
function inicia_fase() {
    console.log("inicia_fase(" + fase + ")");

	atualizarLevelJogo(fase);

    // inicialização de flags de controle
    saltando = false;
    salto_ok = false;
    saltou = false;

    // inicialização do número de obstáculos que já passaram na fase
    conta_obstaculos = 0;

    // inicialização do momento de início da animação do obstáculo
    ts_inicio_anim_obs = 0;

    // recalcula tempos das animações
    calcula_tempos();
}

/* 
 * CALCULOS ÚTEIS PARA MUDANÇA DE FASES
 *  
 *  vel_fundo = WIDTH_PLANO_DE_FUNDO/tempo_animacao_fundo ==> tempo_animacao_fundo =  WIDTH_PLANO_DE_FUNDO / vel_plano_de_fundo;
   
   vel_1o_plano = (WIDTH_JANELA+80) / tempo_animacao_1o_plano ==> tempo_animacao_1o_plano = 1080 / vel_1o_plano;

   tempo_animacao_personagem = tempo_animacao_1o_plano / 3;

   A cada fase velocidade aumentará 50%...e se calculam os novos tempos
*/
// função chamada para recalcular os tempos das animações de fundo e de 1o plano (obstáculos)
function calcula_tempos() {
    console.log("calcula_tempos()");

    var tempo_animacao_fundo = Math.round(WIDTH_PLANO_DE_FUNDO / vel_fundo);
    var el_plano2 = window.document.getElementById("plano2");
    el_plano2.style.WebkitAnimationDuration = tempo_animacao_fundo + "s";
    el_plano2.style.animationDuration = tempo_animacao_fundo + "s";
    console.log("Tempo plano de fundo:" + tempo_animacao_fundo);

    var tempo_animacao_1o_plano = Math.round(1000 * (WIDTH_JANELA + 80) / vel_1o_plano);
    var el_obs = window.document.getElementById("obstaculo1");
    el_obs.style.WebkitAnimationDuration = tempo_animacao_1o_plano + "ms";
    el_obs.style.animationDuration = tempo_animacao_1o_plano + "ms";
    console.log("Tempo 1o plano:" + tempo_animacao_1o_plano);
}

// função chamada para iniciar a animação do obstáculo
function IniciaAnimacaoObstaculo(e) {
    console.log('inciando animacao obstaculo' + contador++);
    hadouken.play();
    var obs_el = window.document.getElementById("obstaculo1");
    // associação da classe anima_obstaculo1 vai provocar o início da animação
    obs_el.className = "anima_obstaculo1";

    // armazena o timestamp (tempo) que iniciou a animação do obstáculo
    var d = new Date();
    ts_inicio_anim_obs = d.getTime();
}

// função chamada a cada finalização de animação
function final_anim_obstaculo() {
    // incremento o número de obstáculos que já passaram
    conta_obstaculos++;
    //console.log("final_anim_obstaculo() - " + conta_obstaculos);

    // se o personagem não teve um salto OK, então houve colisão!
    if (!saltou)
        colisao();
    else
        coin.play();
        
    saltou = false;

    // atualiza display de energia
    atualiza_display_energia();

    // remove animação do obstáculo (retira a classe que implementa a animação)
    var obs_el = window.document.getElementById("obstaculo1");
    obs_el.className = "";

    // verifica se houve mudança de fase
    verifica_mudanca_de_fase();

    // seta um tempo randômico entre (0,1s e 1,1s) para reiniciar animação do obstáculo
    
    //animObstaculo = window.setTimeout(IniciaAnimacaoObstaculo, 100 + Math.floor(Math.random() * 1000));
}

// função chamada quando for identificada colisão 
// (IMPORTANTE: a colisão durante o salto é detectada antes das animações se encontrarem...
//  por isso não é chamada a atualização do display de energia aqui)
function colisao() {
    lifeLost.play();
    perde_energia(10);
}

// função que verifica se houve mudança de fase (critério => número de obstáculos que já passaram nesta fase)
function verifica_mudanca_de_fase() {
    //console.log("verifica_mudanca_de_fase() => " + (conta_obstaculos) + " >= " + nobstaculos);
    if (conta_obstaculos >= nobstaculos)
        muda_fase();
}

// função de mudança de fase
function muda_fase() {
    changeLevel.play();
    ganha_energia(20);
    atualiza_display_energia();
    acrescenta_pontos(100 + 50 * fase);
    atualiza_display_pontos();
    fase++;
    nobstaculos += 5;
    if (fase < 6) {
        vel_fundo *= 1.5;
        vel_1o_plano *= 1.5;
    }
    inicia_fase();
}

// função de incremento de energia
function ganha_energia(incremento) {
    energia += incremento;
    if (energia > 100) energia = 100;
}

function perde_energia(decremento) {
    //console.log("perde_energia(" + decremento + ")");
    energia -= decremento;

    // garante que energia seja menor que 0
    if (energia < 0)
        energia = 0;

    // se acabou a energia => jogo acabou
    if (energia == 0)
        finaliza_jogo();
}

// função chamada pelo acionamento de alguma tecla
function saltar() {
    //console.log("saltar()");

    // se o personagem já estiver saltando, interrompe nova execução
    if (saltando)
        return;

    // seta flags de controle
    saltando = true;

    // verifica se o salto será bem sucedido
    salto_ok = verifica_salto();
    if (salto_ok)
        saltou = true;

    // insere classe que implementa a animação no personagem
    var pers_el = window.document.getElementById("personagem");
    pers_el.className = "anima_personagem";

    // atualiza o tempo de animação do personagem
    var tempo_animacao_personagem = Math.round(1000 * (WIDTH_JANELA + 80) / (3 * vel_1o_plano));
    pers_el.style.WebkitAnimationDuration = tempo_animacao_personagem + "ms";
    pers_el.style.mozAnimationDuration = tempo_animacao_personagem + "ms";
    pers_el.style.animationDuration = tempo_animacao_personagem + "ms";
    //console.log("Tempo personagem:" + tempo_animacao_personagem);
}

// função chamada para verificar se o salto foi bem sucedido
function verifica_salto() {
    //console.log("verifica_salto()");
    // se não iniciou animação não tem validade
    if (ts_inicio_anim_obs == 0)
        return false;

    // determina o intervalo de tempo decorrido (em ms) entre o tempo atual e o início da animação do obstáculo 
    var d = new Date();
    var intervalo = d.getTime() - ts_inicio_anim_obs;

    // calcula a distância do personagem até o obstáculo
    var distancia = WIDTH_JANELA - Math.round(intervalo * vel_1o_plano / 1000);
    //console.log("transcorridos: " + intervalo + " ms! => distancia: " + distancia + "pixels");

    // verifica se a distância entre o personagem e o obstáculo permite um salto OK!
    // (Obs: valores ajustados empiricamente!)
    if (distancia > 105 && distancia <= 180) {
        //console.log("salto OK!");
        return true;
    }
    // está em uma distância em que haverá colisão
    else if (distancia > 300 && distancia <= 450) {
        //console.log("VAI BATER!!!");
        return false;
    }
    // se a distância muito grande é porque o salto foi feito antes da hora
    else if (distancia > 450) {
        //console.log("salto ANTES da hora!");
        return false;
    }
    return false;
}

// função chamada quando ocorrer o fim da animação do personagem
function fim_do_salto() {
    //console.log("fim_do_salto()");

    // se o personagem fez um salto bem sucedido, ganha pontos
    if (salto_ok) {
        acrescenta_pontos(10 + 5 * fase);
        atualiza_display_pontos();
    }

    // reseta variáveis de controle	
    saltando = false;
    salto_ok = false;

    // remove classe de animação do personagem
    var pers_el = window.document.getElementById("personagem");
    pers_el.className = "caminha_personagem";

}

// função para acrescentar pontos
function acrescenta_pontos(incremento) {
    //console.log("acrescenta_pontos(" + incremento + ")");
    pontos += incremento;
}

// função para finalizar jogo
function finaliza_jogo() {
    //console.log("finaliza_jogo()");
    ken.removeEventListener('animationiteration',IniciaAnimacaoObstaculo);
    ken.removeEventListener('webkitAnimationIteration',IniciaAnimacaoObstaculo);
    ken.removeEventListener('mozAnimationIteration',IniciaAnimacaoObstaculo);
    ken.removeEventListener('oanimationiteration',IniciaAnimacaoObstaculo);
    ken.removeEventListener('MSAnimationIteration',IniciaAnimacaoObstaculo);
    atualiza_display_energia();
    atualizarLevelJogo('KO');
    backgroundSong.pause();
    death.play();
    //you.play();
    //clearTimeout(animObstaculo);
    setTimeout(function(){
      you.play();
    },1000);
        setTimeout(function(){
      lose.play();
    },2000);
    setTimeout(function(){
      //console.log('Waiting...');
    },5000);

    limparListenerObstaculo();
    mostrarTelaGameOver();
}

function atualizarLevelJogo(lvl){
    var el = window.document.getElementById('level');
    el.innerHTML = lvl;
    
    if(typeof lvl != 'number' && lvl.indexOf('KO') != -1){
        return;
    }
    
    var elSpan = window.document.getElementById('round');
    elSpan.innerHTML = 'Round '+lvl;
    
    if(lvl == 1){
        setTimeout(function(){
            var elSpan = window.document.getElementById('round');
            elSpan.innerHTML = 'FIGHT!!!';
            fight.play();
        }, 2000);
    }
    
    setTimeout(function(){
        var elSpan = window.document.getElementById('round');
        elSpan.innerHTML = '';
    }, 3000);
}

function limparListenerObstaculo(){
    var obstaculo1 = window.document.getElementById('obstaculo1');
    var obstaculo1Clone = obstaculo1.cloneNode(true);

    obstaculo1.parentNode.replaceChild(obstaculo1Clone, obstaculo1);
}

function mostrarTelaGameOver(){
    atualizarDisplayDivEndGame('block');
    
    var count = 5;
    var intervalo = setInterval(function(){
        if (count < 0) {
            clearInterval(intervalo);
            atualizarContagemGameOver("");
            exibirBotaoReinicio();
            return;
        };
        atualizarContagemGameOver(count);
        count = count - 1;
    },1000);
}

function atualizarContagemGameOver(texto){
    var smallCount = window.document.getElementById('count-small');
    var continueCount = "";
    if(texto != ""){
        continueCount = "CONTINUE? " + texto;
    }
    smallCount.innerHTML = continueCount;
    
    var bigCount = window.document.getElementById('count-big');     
    bigCount.innerHTML = texto;
}

function atualizarDisplayDivEndGame(display){
    var divEndGame = window.document.getElementById('end-game');
    divEndGame.style.display = display;
}

function exibirBotaoReinicio(){
    var spanRestartGame = window.document.createElement('span');
    spanRestartGame.innerHTML = "CLICK HERE TO RESTART GAME";
    spanRestartGame.setAttribute('onclick', 'restartGame();');
    spanRestartGame.setAttribute('class', 'font-street-fighter restart-game blink');

    var divEndGame = window.document.getElementById('end-game');
    divEndGame.appendChild(spanRestartGame);
}

function restartGame(){
    window.location.reload();
}