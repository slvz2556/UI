
using Microsoft.JSInterop;

namespace UI.Components.Templates.Menu;

public partial class Menu
{
    enum Items
    {
        Item1,
        Item2,
        Item3
    }
    Items selectedItem = Items.Item1;

    private void ChangeItems(Items item)
    {
        selectedItem = item;
    }

    protected override async void OnAfterRender(bool firstRender) { if (firstRender) await Js.InvokeVoidAsync("_highlightAll"); }
}
