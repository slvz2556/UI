using Microsoft.JSInterop;

namespace UI.Components.Cards;

public partial class Cards
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }
}
