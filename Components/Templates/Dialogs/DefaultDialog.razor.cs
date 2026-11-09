namespace UI.Components.Templates.Dialogs;

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