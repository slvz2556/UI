using Microsoft.JSInterop;

namespace UI.Components.Layout;

public partial class LayoutDesigner
{
    protected async override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("InitializeLayoutDesigner");
    }
}
