Vagrant::Config.run do |config|
	config.vm.box = 'lucid32'
	config.vm.box_url = 'http://files.vagrantup.com/lucid32.box'

 	config.vm.provision :chef_solo do |chef|
	    chef.cookbooks_path = ['chef_repo/cookbooks']
    	chef.roles_path = 'chef_repo/roles'

    	chef.add_role 'base'
    	chef.add_role 'website'
 	end

end