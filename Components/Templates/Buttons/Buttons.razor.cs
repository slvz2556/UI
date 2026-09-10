using Microsoft.JSInterop;

namespace UI.Components.Templates.Buttons;

public partial class Buttons
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }
}
