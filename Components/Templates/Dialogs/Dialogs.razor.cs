using Microsoft.JSInterop;

namespace UI.Components.Templates.Dialogs;

public partial class Dialogs
{
    protected override async void OnAfterRender(bool firstRender)
    {
        if (firstRender)
            await Js.InvokeVoidAsync("_highlightAll");
    }


    private const string defaultDialogRazor =
"""
@if (defaultDialog.Visible)
{
    <dialog class="slvz-dialog">
        <div class="slvz-dialog-body">
        </div> 
    </dialog> 
}
""";
    private const string defaultDialogCsharp1 =
"""
public partial class DefaultDialog : IDisposable
{
    public void Dispose()
    {
        defaultDialog.OnChange -= SampleDialog_OnChange;
    }

    protected override void OnInitialized()
    {
        defaultDialog.OnChange += SampleDialog_OnChange;
    }

    private async void SampleDialog_OnChange(object? sender, EventArgs e)
        => await InvokeAsync(StateHasChanged);
}
public partial class IDefaultDialog
{
    public event EventHandler OnChange = delegate { };
    public bool Visible = false;


    public void OpenDialog()
    {
        Visible = true;
        OnChange.Invoke(0, EventArgs.Empty);
    }

    public void CloseDialog()
    {
        Visible = false;
        OnChange.Invoke(0, EventArgs.Empty);
    }
}
""";
    private const string defaultDialogCsharp2 =
"""
//In `Program.cs`
builder.Services.AddSingleton<IDefaultDialog>();
""";
    private const string defaultDialogInject =
"""
@*In `_Imports.razor`*@
@inject IDefaultDialog defaultDialog 
""";






    private const string bottomSheetDialogRazor =
"""
@if (bottomSheetDialog.Visible)
{
    <dialog class="slvz-bottomsheet-dialog">

        <div class="slvz-bottomsheet-dialog-empty-space" @onclick="bottomSheetDialog.CloseDialog"></div>

        <div class="slvz-bottomsheet-dialog-body">

            <div class="slvz-drag-handle" onpointerdown="onDialogDragStart(event, this)"><span></span></div>

            <button class="slvz-button default btn-dialog-done" @onclick="bottomSheetDialog.CloseDialog">Close</button>

        </div>
    </dialog>
}
""";
    private const string bottomSheetDialogCsharp1 =
"""
public partial class BottomSheetDialog : IDisposable
{
    public void Dispose()
    {
        bottomSheetDialog.OnChange -= SampleDialog_OnChange;
    }

    protected override void OnInitialized()
    {
        bottomSheetDialog.OnChange += SampleDialog_OnChange;
    }

    private async void SampleDialog_OnChange(object? sender, EventArgs e)
        => await InvokeAsync(StateHasChanged);
}
public partial class IBottomSheetDialog
{
    public event EventHandler OnChange = delegate { };
    public bool Visible = false;


    public void OpenDialog()
    {
        Visible = true;
        OnChange.Invoke(0, EventArgs.Empty);
    }

    public void CloseDialog()
    {
        Visible = false;
        OnChange.Invoke(0, EventArgs.Empty);
    }
}
""";
    private const string bottomSheetDialogCsharp2 =
"""
//In `Program.cs`
builder.Services.AddSingleton<IBottomSheetDialog>();
""";
    private const string bottomSheetDialogInject =
"""
@*In `_Imports.razor`*@
@inject Components.Templates.Dialog.IBottomSheetDialog bottomSheetDialog
""";



}
