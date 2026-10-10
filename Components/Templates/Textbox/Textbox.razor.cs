using Microsoft.JSInterop;

namespace UI.Components.Templates.Textbox;

public partial class Textbox
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }

    private const string txtNormal =
"""
<div class="slvz-textbox">
    <input type="text" placeholder="Write something" maxlength="100" /> 
</div>
""";

    private const string txtIcon =
"""
<div class="slvz-textbox">
    <img src='https://ui.slvz.dev/icons/Search/ic_fluent_search_20_regular.svg'/>
    <input type="text" placeholder="Search something" maxlength="100" /> 
</div>
""";

    private const string txtIconButton =
"""
<div class="slvz-textbox">
    <img src='https://ui.slvz.dev/icons/Search/ic_fluent_search_20_regular.svg'/>
    <input type="text" placeholder="Search something" maxlength="100" /> 
<button class="slvz-button default">Go</button> 
</div>
""";
}
