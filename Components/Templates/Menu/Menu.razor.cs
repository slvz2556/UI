
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

    protected override async void OnAfterRender(bool firstRender) 
    { 
        if (firstRender) 
            await Js.InvokeVoidAsync("_highlightAll"); 
    }


    private const string dropDown =
"""
<div class="slvz-drop-down">
    <div class="slvz-drop-down-body slvz-button default" onclick="OpenDropDownList(this)">
        <span> @selectedItem.ToString() </span>
        <img src='https://ui.slvz.dev/icons/iOS%20Arrow%20RTL/ic_fluent_ios_arrow_rtl_24_regular.svg'/> 
    </div>


    <div class="slvz-drop-down-list drop-hide">
        <button class='slvz-button @(selectedItem==Items.Item1 ? "pale" : "default")' @onclick='() => ChangeItems(Items.Item1)'>
            @Items.Item1.ToString()
        </button>
        <button class='slvz-button @(selectedItem==Items.Item2 ? "pale" : "default")' @onclick='() => ChangeItems(Items.Item2)'>
            @Items.Item2.ToString()
        </button>
        <button class='slvz-button @(selectedItem==Items.Item3 ? "pale" : "default")' @onclick='() => ChangeItems(Items.Item3)'>
            @Items.Item3.ToString()
        </button>
    </div>

</div>


@code{
    enum Items
    {
        Item1, Item2, Item3
    }
    Items selectedItem = Items.Item1;
    private void ChangeItems(Items item)
    {
        selectedItem = item; 
    }
}
""";

    private const string overflowList =
"""
<div class="slvz-overflow-menu">")
    <div class="slvz-overflow-menu-button slvz-button default" onclick="OpenDropDownList(this)">
        <img src='https://ui.slvz.dev/icons/More%20Horizontal/ic_fluent_more_horizontal_20_regular.svg'/> 
    </div>

    <div class="slvz-overflow-menu-list drop-hide">
        <button class='slvz-button default' @onclick='() => ChangeItems(Items.Item1)'>
            @Items.Item1.ToString()
        </button>
        <button class='slvz-button default' @onclick='() => ChangeItems(Items.Item2)'>
            @Items.Item2.ToString()
        </button>
        <button class='slvz-button default' @onclick='() => ChangeItems(Items.Item3)'>
            @Items.Item3.ToString()
        </button>
    </div>

</div>


@code{
    enum Items
    {
        Item1, Item2, Item3
    }

    private void ChangeItems(Items item)
    {
        //Do something 
    }
}
""";


}
