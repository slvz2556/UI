using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace UI.Components.Templates.Trackbar;

public partial class Trackbar
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }


    public int Value { get; set; } = 50;
    public double Min { get; set; } = 0;
    public double Max { get; set; } = 100;
    public int Steps { get; set; } = 1;

    private string FillWidth => $"{(((double)Value - Min) / (Max - Min)) * 100}%";

    private void OnInput(ChangeEventArgs e)
    {
        Value = int.Parse(e.Value?.ToString());
        //Do somthing
    }


}
