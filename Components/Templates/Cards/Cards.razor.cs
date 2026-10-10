using Microsoft.JSInterop;

namespace UI.Components.Templates.Cards;

public partial class Cards
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }

    private const string cardPale =
"""
<div class=\"slvz-card pale\"></div>
""";

    private const string cardDefault =
"""
<div class=\"slvz-card default\"></div>
""";
}
