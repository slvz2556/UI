using Microsoft.JSInterop;

namespace UI.Components.Templates.Dialog;

public partial class Dialog
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }

    private const string dialog =
"""
<div class="slvz-dialog">
    <div class="slvz-dialog-body">
    </div> 
</div> 
""";

}
