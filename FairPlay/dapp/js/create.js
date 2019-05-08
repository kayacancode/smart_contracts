const fun = new MainFun();
const tip = IUToast;
const lgb = fun.languageChoice();
var webBrowser = new AppLink();
var abi = '';
var bin = '';

$(function () {
    window.lgb = lgb;
    webBrowser.openBrowser();
    // init the abi and bin
    getAbi();
    getBin();
    initLanguage();
   // initLinkTb();

    $('.image-upload-wrap').bind('dragover', function () {
             $('.image-upload-wrap').addClass('image-dropping');
    });
    $('.image-upload-wrap').bind('dragleave', function () {
             $('.image-upload-wrap').removeClass('image-dropping');
    });
    // Data Picker Initialization
    // $('.datepicker').pickadate();
    $('#cutoff').datetimepicker({
            minDate: moment().add(1, 'm'),
            icons: {
                time: 'far fa-clock',
                date: 'far fa-calendar',
                up: 'fas fa-arrow-up',
                down: 'fas fa-arrow-down',
                previous: 'fas fa-chevron-left',
                next: 'fas fa-chevron-right',
                today: 'far fa-calendar-check-o',
                clear: 'far fa-trash',
                close: 'far fa-times'
            },
    });
});

// init language
var initLanguage = function () {
    if (lgb == '' || lgb == null) {
        return;
    }
     $("[data-translate]").each(function(){
        var key = $(this).data('translate');
       if(lgb[key]){
            if(this.tagName.toLowerCase() == "input"){
                $(this).attr("placeholder", lgb[key])
            }else{
                $(this).html(lgb[key]);
            }
        }
    });
}

var initLinkTb = function(){
    var $TABLE = $('#table');
    $('.table-add').click(function () {
    var $clone = $TABLE.find('tr.d-none').clone(true).removeClass('d-none table-line');
    $TABLE.find('table').append($clone);
    });

    $('.table-remove').click(function () {
    $(this).parents('tr').detach();
    });

    $('.table-up').click(function () {
    var $row = $(this).parents('tr');
    if ($row.index() === 1) return; // Don't go above the header
    $row.prev().before($row.get(0));
    });

    $('.table-down').click(function () {
    var $row = $(this).parents('tr');
    $row.next().after($row.get(0));
    });
}

var create = function () {
    tip.loading(lgb["creating"] || "Creating contract ... This could take a few minutes!");
    web3.cmt.getAccounts(function (e, address) {
        if (e) {
            tip.error(lgb["error"] || "There is an error");
        } else {
            var userAddress = address.toString();
            var title = $('#title').val();
            var desc = $('#desc').val();
            desc = "{\"desc\":\"" + desc + "\"}";
            //desc = "{\"desc\":\"" + desc + "\",\"shopping\":[\""+ var1 +"\":\""+ link1 +"\"]}";

            var image_url = $('#img').val();
            var num_of_winners = $('#num').val();
            var cutoff_ts = $('#cutoff').datetimepicker('date').unix();
            
            var contract = web3.cmt.contract(abi);
            var data = '0x' + contract.new.getData(title, desc, image_url, num_of_winners, cutoff_ts, {data: bin.object});

            contract.new([title, desc, image_url, num_of_winners, cutoff_ts], {
                from: userAddress.toString(),
                data: data,
                gas: '9999000',
                gasPrice: 2000000000
            }, function (e, instance) {
                if (e) {
                    console.log(e);
                    tip.close();
                    tip.error(lgb["fail_to_create"] || "Failed to create contract");
                } else {
                    console.log(instance.address);
                    if (instance.address != undefined) {
                        window.location.href = "qrcode.html?code=" + instance.address;
                    } else {
                        var checkTransactionTimer = setInterval(function () {
                            web3.cmt.getTransactionReceipt(instance.transactionHash, function (error, result) {
                                if (!error) {
                                    if (result != null && result.status == '0x1') {
                                        clearInterval(checkTransactionTimer);
                                        if (result.contractAddress != undefined) {
                                            window.location.href = "qrcode.html?code=" + result.contractAddress;
                                        } else if (result.address != undefined) {
                                            window.location.href = "qrcode.html?code=" + result.address;
                                        } else {
                                            tip.close();
                                            tip.error("Could not get a contract address");
                                        }
                                    } else if (result != null && result.status == '0x0') {
                                        tip.close();
                                        tip.error(lgb["fail_to_create"] || "Failed to create contract");
                                        clearInterval(checkTransactionTimer);
                                    }
                                }
                            })
                        }, 3000);
                    }
                }
            });
        }
    });
}

var getAbi = function () {
    $.ajax({
        url: 'FairPlay.abi',
        sync: true,
        dataType: 'text',
        success: function (data) {
            abi = JSON.parse(data);
        }
    });
}

var getBin = function () {
    $.ajax({
        url: 'FairPlay.bin',
        dataType: 'text',
        sync: true,
        success: function (data) {
            bin = JSON.parse(data);
        }
    });
}

function imgfrom(imgsource){
    if(imgsource.id == "fromurl"){
        $("#url-input").removeClass("d-none");
        $("#local-input").addClass("d-none");
        $("#fromurl").addClass("btn-outline-dark");
        $("#fromlocal").removeClass("btn-outline-dark");
    }else if(imgsource.id == "fromlocal"){
        $("#url-input").addClass("d-none");
        $("#local-input").removeClass("d-none");
        $("#fromurl").removeClass("btn-outline-dark");
        $("#fromlocal").addClass("btn-outline-dark");
    }
}

function removeUpload() {
  $('.file-upload-input').replaceWith($('.file-upload-input').clone());
  $('.file-upload-content').hide();
  $(".uploading-text").addClass("d-none");

  $('.image-upload-wrap').show();
}

$('#img-form').ajaxForm({
    beforeSubmit: function(){
        var imgname = $("#selected-img").val()
        var ext = imgname.substr( (imgname.lastIndexOf('.') +1) );
        var imgsize = $('#selected-img')[0].files[0].size / 1024 / 1024; // in MB
        console.log(ext, imgsize)
        if (ext=='jpg' || ext=='jpeg' || ext=='png' || ext=='gif' || ext=='PNG' || ext=='JPG' || ext=='JPEG'){
            if(imgsize <= 3){
                $(".uploading-text").removeClass("d-none");
                $(".drag-text").addClass("d-none");

                return true;
            }
        }
        
        $("#local-input").removeClass("d-none");
        tip.error(lgb["fail_to_upload"] || "Fail to upload. Please check your size and extension.");
        return false;
    },
    success: function(data) {
        url = data['secure_url']

        $(".uploading-text").addClass("d-none");
        $(".drag-text").removeClass("d-none");

        $('.image-upload-wrap').hide();
        $("#uploaded").attr("src", url)
        $('.file-upload-content').show();
        $('.image-title').html($("#selected-img").val());

        $("#img").val(url)
    }
}); 


function uploadPic(){
    if($("#selected-img").val()){
           console.log("start")
          $("#submit").click()
    }
}