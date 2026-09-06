

window.addEventListener('load', function () {
    let _color = localStorage.getItem("Color");

    if (_color != null) {
        if (_color.length > 0) {
            SetTheme(_color);
        }
    }
    else {
        _color = "azuresky";
        SetTheme(_color);
    }

});


//Theme

function SetTheme(_color) {
    //remove all classes
    document.querySelector("body").removeAttribute('class');

    //set current theme
    document.querySelector("body").classList.add(_color);


    localStorage.setItem("Color", _color);
}




function ScrollToTop() {
    document.querySelector('.grid').scrollTo({ top: 0, behavior: 'smooth' });
}

function CopyText(val) {
    navigator.clipboard.writeText(val);
}


function DownloadFile(url) {
    var a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


window.getNewBatch = (el) => {
    var sTop = el ? el.scrollTop : 0;
    var sHeight = el ? el.scrollHeight : 0;
    var cHeight = el ? el.clientHeight : 0;

    if (sTop + cHeight >= sHeight - 50)
        return true;
    else
        return false;

}




function HambergerClick() {
    if (window.innerWidth < 800) {

        if (document.querySelector('.hamberger-action') == null) {
            var HmbergerMenu = document.querySelector('.open-close-menu');
            HmbergerMenu.removeAttribute('class');
            HmbergerMenu.classList.add('hamberger-action');
            HmbergerMenu.classList.add('open-close-menu');

            document.querySelector('#menu').classList.remove('nav-close');
            document.querySelector('#menu').classList.add('nav-open');

            document.querySelector('#black-layer').style.display = "block";
        }
        else {
            var HmbergerMenu = document.querySelector('.open-close-menu');
            HmbergerMenu.removeAttribute('class');
            HmbergerMenu.classList.add('open-close-menu');

            document.querySelector('#menu').classList.remove('nav-open');
            document.querySelector('#menu').classList.add('nav-close');

            document.querySelector('#black-layer').style.display = "none";
        }
    }
}


function _highlightAll() {
    hljs.highlightAll();
}





async function CopyCode(btn) {
    const code = btn.closest('.codeblock').querySelector('code').innerText;
    try {
        await navigator.clipboard.writeText(code);
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    const label = btn.querySelector('.copy-label');
    const original = label.textContent;
    label.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => {
        label.textContent = original;
        btn.classList.remove('copied');
    }, 1800);
}