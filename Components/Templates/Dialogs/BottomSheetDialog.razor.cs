namespace UI.Components.Templates.Dialogs;

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