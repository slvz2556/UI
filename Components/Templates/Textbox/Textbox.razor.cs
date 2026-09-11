using Microsoft.JSInterop;

namespace UI.Components.Templates.Textbox;

public partial class Textbox
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }
}
