using Microsoft.JSInterop;

namespace UI.Components.Templates.Buttons;

public partial class Buttons
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }


    private const string btnPrimary =
"""
<button class=\"slvz-button primary\">Click me</button>
""";

    private const string btnPale =
"""
<button class=\"slvz-button pale\">Click me</button>
""";

    private const string btnDefault =
"""
<button class=\"slvz-button default\">Click me</button>
""";

    private const string btnIcon =
"""
<button class="slvz-button primary slvz-icon">
    <img src='https://ui.slvz.dev/icons/Heart/ic_fluent_heart_20_filled.svg'/>
    Click me
</button>
""";
}
