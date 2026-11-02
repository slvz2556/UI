namespace UI.Components.Templates.Dialog;

public partial class SampleDialog : IDisposable
{
    public void Dispose()
    {
        sampleDialog.OnChange -= SampleDialog_OnChange;
    }

    protected override void OnInitialized()
    {
        sampleDialog.OnChange += SampleDialog_OnChange;
    }

    private async void SampleDialog_OnChange(object? sender, EventArgs e)
        => await InvokeAsync(StateHasChanged);
}
public partial class ISampleDialog
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