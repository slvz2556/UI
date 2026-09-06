

using UI.Models.Menu;

namespace UI.Layout;

public partial class MainLayout : IDisposable
{
    bool listOpened = true;
    List<MenuItem> MenuItems = new List<MenuItem>();

    protected override void OnInitialized()
    {
        CreateMenuList();
    }
    protected async override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Navigation.LocationChanged += Navigation_LocationChanged;
            Navigation_LocationChanged(0, null);
        }
    }

    private async void Navigation_LocationChanged(object? sender, Microsoft.AspNetCore.Components.Routing.LocationChangedEventArgs e)
    {
        MenuItems.ForEach((i) => i.Selected = false);

        var location = Navigation.Uri.Replace(Navigation.BaseUri,"");

        if (MenuItems.Any(x => x.Location == location.ToLower()))
            MenuItems.Where(x => x.Location == location.ToLower()).First().Selected = true;
        
        else
            MenuItems[0].Selected = true;

        await InvokeAsync(StateHasChanged);
    }

    string? Home, Icons;

    private void ChangeListStatus()
    {
        listOpened = !listOpened;
    }


    public void Dispose()
    {
        Navigation.LocationChanged -= Navigation_LocationChanged;
    }




    void CreateMenuList()
    {
        MenuItems.Clear();

        MenuItems.Add(new MenuItem { Name = "Overview", Location = "/", Selected = false });
        MenuItems.Add(new MenuItem { Name = "Fluent icons", Location = "fluent-icons", Selected = false });

        MenuItems.Add(new MenuItem { Name = "Colors", Location = "colors", Selected = false });
    }

}
